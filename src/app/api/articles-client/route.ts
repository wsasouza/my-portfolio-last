import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { ArticleData } from '@/types/articles';

function generateMDXContent({
  title,
  description,
  author,
  date,
  content,  
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
  
  const yamlFrontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
author: "${author.replace(/"/g, '\\"')}"
date: "${date}"
---

`;  
  
  return yamlFrontmatter + processedContent;
}

export async function POST(request: Request) {
  try {
    const articleData: ArticleData = await request.json();
    
    const { title, description, author, date, slug, content, imageUrls, tags } = articleData;    
    
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
      tags,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return NextResponse.json({ success: true, slug, id: documentId });
  } catch (error) {
    console.error('Erro ao salvar artigo:', error);
    return NextResponse.json(
      { error: 'Falha ao salvar o artigo' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const articleData: ArticleData = await request.json();
    
    const { id, title, description, author, date, slug, content, imageUrls, tags } = articleData;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do artigo é obrigatório para atualização' },
        { status: 400 }
      );
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
      tags,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return NextResponse.json({ success: true, slug, id });
  } catch (error) {
    console.error('Erro ao atualizar artigo:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar o artigo' },
      { status: 500 }
    );
  }
} 
