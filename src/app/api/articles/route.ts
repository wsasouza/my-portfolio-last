import { NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

function getPublicStorageUrl(fileName: string): string {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID não está definido');
  }  
  
  return `https://storage.googleapis.com/${projectId}.appspot.com/${fileName}`;
}

function generateMDXContent({
  title,
  description,
  author,
  date,
  content,
  imageUrls,
}: {
  title: string;
  description: string;
  author: string;
  date: string;
  content: string;
  imageUrls: Record<string, string>;
}) {  
  let processedContent = content;  
  
  if (processedContent.startsWith('---')) {
    const endMarkerIndex = processedContent.indexOf('---', 3);
    if (endMarkerIndex !== -1) {      
      processedContent = processedContent.substring(endMarkerIndex + 3).trim();
    }
  }  
  
  const lines = processedContent.split('\n');
  const firstLines = lines.slice(0, 5);
  
  if (firstLines.some(line => 
      line.startsWith('title:') || 
      line.startsWith('description:') || 
      line.startsWith('author:') || 
      line.startsWith('date:'))) {
    
    const nonFrontmatterIndex = lines.findIndex(line => 
      !line.startsWith('title:') && 
      !line.startsWith('description:') && 
      !line.startsWith('author:') && 
      !line.startsWith('date:') && 
      line.trim() !== '');
    
    if (nonFrontmatterIndex !== -1) {
      processedContent = lines.slice(nonFrontmatterIndex).join('\n');
    }
  }  
  
  const yamlFrontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
author: "${author.replace(/"/g, '\\"')}"
date: "${date}"
---

`;  
  
  return yamlFrontmatter + processedContent;
}

export async function GET(request: Request) {
  try {    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '4', 10);
        
    const validatedLimit = Math.min(Math.max(1, limit), 20); 
    const validatedPage = Math.max(1, page);    
    
    const offset = (validatedPage - 1) * validatedLimit;    
    
    const countSnapshot = await db.collection('articles').count().get();
    const totalCount = countSnapshot.data().count;    
    
    const articlesSnapshot = await db.collection('articles')
      .orderBy('date', 'desc')
      .limit(validatedLimit)
      .offset(offset)
      .get();
    
    const articles = articlesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id, 
        slug: data.slug, 
        ...data,
      };
    });    
    
    const hasMore = offset + articles.length < totalCount;
    
    return NextResponse.json({
      articles,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        totalCount,
        totalPages: Math.ceil(totalCount / validatedLimit),
        hasMore
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao buscar artigos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const author = formData.get('author') as string;
    const date = formData.get('date') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const tagsJson = formData.get('tags') as string;
    let tags: string[] = [];

    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson);
      } catch (e) {
        console.error('Erro ao fazer parse das tags:', e);
      }
    }    
    
    const imageFiles = formData.getAll('images') as File[];
    const imageUrls: Record<string, string> = {};    
    
    for (const file of imageFiles) {
      try {        
        const fileBuffer = await file.arrayBuffer();
        const fileName = `articles/${slug}/${uuidv4()}-${file.name}`;        
        
        const fileRef = storage.bucket().file(fileName);        
        
        await fileRef.save(Buffer.from(fileBuffer), {
          metadata: {
            contentType: file.type,
          },
        });        
        
        await fileRef.makePublic();        
        
        const publicUrl = getPublicStorageUrl(fileName);        
        imageUrls[file.name] = publicUrl;
      } catch (error) {
        const uploadError = error as Error;
        console.error(`Erro no upload: ${uploadError.message}`);
        throw new Error(`Falha no upload da imagem ${file.name}: ${uploadError.message}`);
      }
    }    
    
    const mdxContent = generateMDXContent({
      title,
      description,
      author,
      date,
      content,
      imageUrls,
    });    
    
    const articleRef = db.collection('articles').doc();
    const documentId = articleRef.id;    
    
    await articleRef.set({
      title,
      description,
      author,
      date,
      slug, 
      content: mdxContent,
      imageUrls,
      tags: tags.length > 0 ? tags : undefined,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return NextResponse.json({ success: true, slug, id: documentId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao salvar o artigo' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    
    const id = formData.get('id') as string; 
    const slug = formData.get('slug') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const author = formData.get('author') as string;
    const date = formData.get('date') as string;
    const content = formData.get('content') as string;
    const tagsJson = formData.get('tags') as string;
    let tags: string[] = [];

    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson);
      } catch (e) {
        console.error('Erro ao fazer parse das tags:', e);
      }
    }
    
    const existingImagesJson = formData.get('existingImages') as string;
    let existingImageUrls: Record<string, string> = {};
    
    if (existingImagesJson) {
      existingImageUrls = JSON.parse(existingImagesJson);
    }    
    
    const imageFiles = formData.getAll('images') as File[];
    const imageUrls = { ...existingImageUrls };    
    
    for (const file of imageFiles) {
      try {        
        const fileBuffer = await file.arrayBuffer();
        const fileName = `articles/${slug}/${uuidv4()}-${file.name}`;        
        
        const fileRef = storage.bucket().file(fileName);        
        
        await fileRef.save(Buffer.from(fileBuffer), {
          metadata: {
            contentType: file.type,
          },
        });        
        
        await fileRef.makePublic();        
        
        const publicUrl = getPublicStorageUrl(fileName);        
        imageUrls[file.name] = publicUrl;
      } catch (error) {
        const uploadError = error as Error;
        console.error(`PUT: Erro no upload: ${uploadError.message}`);
        throw new Error(`Falha no upload da imagem ${file.name}: ${uploadError.message}`);
      }
    }    
    
    const mdxContent = generateMDXContent({
      title,
      description,
      author,
      date,
      content,
      imageUrls,
    });    
    
    await db.collection('articles').doc(id).update({
      title,
      description,
      author,
      date,
      slug,
      content: mdxContent,
      imageUrls,
      tags: tags.length > 0 ? tags : undefined,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return NextResponse.json({ success: true, slug, id });
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao atualizar o artigo' },
      { status: 500 }
    );
  }
} 
