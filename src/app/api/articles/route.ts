import { NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Função auxiliar para gerar URLs públicas para o Firebase Storage
function getPublicStorageUrl(fileName: string): string {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID não está definido no arquivo .env.local');
  }
  
  // Formato de URL pública do Firebase Storage
  return `https://storage.googleapis.com/${projectId}.appspot.com/${fileName}`;
}

// Função utilitária para gerar o conteúdo MDX
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
  // Limpar qualquer frontmatter existente no conteúdo
  let processedContent = content;
  
  // Verificar se o conteúdo já começa com uma seção de frontmatter
  if (processedContent.startsWith('---')) {
    const endMarkerIndex = processedContent.indexOf('---', 3);
    if (endMarkerIndex !== -1) {
      // Remover o frontmatter existente
      processedContent = processedContent.substring(endMarkerIndex + 3).trim();
    }
  }
  
  // Verificar se o conteúdo tem linhas que parecem ser frontmatter
  const lines = processedContent.split('\n');
  const firstLines = lines.slice(0, 5);
  
  if (firstLines.some(line => 
      line.startsWith('title:') || 
      line.startsWith('description:') || 
      line.startsWith('author:') || 
      line.startsWith('date:'))) {
    // Remover linhas que parecem ser frontmatter
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
  
  // Gerar o frontmatter YAML com aspas para evitar problemas com caracteres especiais
  const yamlFrontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
author: "${author.replace(/"/g, '\\"')}"
date: "${date}"
---

`;
  
  // Combinar o frontmatter com o conteúdo
  return yamlFrontmatter + processedContent;
}

export async function GET(request: Request) {
  try {
    // Obter parâmetros de consulta
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    
    // Validar parâmetros
    const validatedLimit = Math.min(Math.max(1, limit), 20); // Limite entre 1 e 20
    const validatedPage = Math.max(1, page);
    
    // Calcular offset para paginação
    const offset = (validatedPage - 1) * validatedLimit;
    
    // Obter a contagem total de artigos
    const countSnapshot = await db.collection('articles').count().get();
    const totalCount = countSnapshot.data().count;
    
    // Buscar artigos paginados
    const articlesSnapshot = await db.collection('articles')
      .orderBy('date', 'desc')
      .limit(validatedLimit)
      .offset(offset)
      .get();
    
    const articles = articlesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id, // ID do documento
        slug: data.slug, // slug para URLs amigáveis
        ...data,
      };
    });
    
    // Calcular se há mais artigos
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
    
    // Processar imagens
    const imageFiles = formData.getAll('images') as File[];
    const imageUrls: Record<string, string> = {};
    
    // Upload de cada imagem para o Firebase Storage
    for (const file of imageFiles) {
      try {
        console.log(`Iniciando upload da imagem: ${file.name}, tamanho: ${file.size} bytes`);
        const fileBuffer = await file.arrayBuffer();
        const fileName = `articles/${slug}/${uuidv4()}-${file.name}`;
        console.log(`Caminho do arquivo no Storage: ${fileName}`);
        
        const fileRef = storage.bucket().file(fileName);
        
        console.log(`Salvando arquivo no Firebase Storage...`);
        await fileRef.save(Buffer.from(fileBuffer), {
          metadata: {
            contentType: file.type,
          },
        });
        
        console.log(`Arquivo salvo, tornando público...`);
        // Tornar o arquivo público
        await fileRef.makePublic();
        
        // Obter URL pública da imagem
        const publicUrl = getPublicStorageUrl(fileName);
        console.log(`URL pública gerada: ${publicUrl}`);
        imageUrls[file.name] = publicUrl;
      } catch (error) {
        const uploadError = error as Error;
        console.error(`Erro no upload: ${uploadError.message}`);
        throw new Error(`Falha no upload da imagem ${file.name}: ${uploadError.message}`);
      }
    }
    
    // Gerar o conteúdo MDX com as URLs do Firebase Storage
    const mdxContent = generateMDXContent({
      title,
      description,
      author,
      date,
      content,
      imageUrls,
    });
    
    // Gerar ID automático no Firestore
    const articleRef = db.collection('articles').doc();
    const documentId = articleRef.id;
    
    // Salvar o artigo no Firestore com ID gerado automaticamente
    await articleRef.set({
      title,
      description,
      author,
      date,
      slug, // mantemos o slug para URLs amigáveis
      content: mdxContent,
      imageUrls,
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
    
    const id = formData.get('id') as string; // ID do documento
    const slug = formData.get('slug') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const author = formData.get('author') as string;
    const date = formData.get('date') as string;
    const content = formData.get('content') as string;
    
    // Buscar imageUrls existentes
    const existingImagesJson = formData.get('existingImages') as string;
    let existingImageUrls: Record<string, string> = {};
    
    if (existingImagesJson) {
      existingImageUrls = JSON.parse(existingImagesJson);
    }
    
    // Processar novas imagens
    const imageFiles = formData.getAll('images') as File[];
    const imageUrls = { ...existingImageUrls };
    
    console.log(`PUT: Processando ${imageFiles.length} novas imagens`);
    console.log(`PUT: Já existem ${Object.keys(existingImageUrls).length} imagens`);
    
    for (const file of imageFiles) {
      try {
        console.log(`PUT: Iniciando upload da imagem: ${file.name}, tamanho: ${file.size} bytes`);
        const fileBuffer = await file.arrayBuffer();
        const fileName = `articles/${slug}/${uuidv4()}-${file.name}`;
        console.log(`PUT: Caminho do arquivo no Storage: ${fileName}`);
        
        const fileRef = storage.bucket().file(fileName);
        
        console.log(`PUT: Salvando arquivo no Firebase Storage...`);
        await fileRef.save(Buffer.from(fileBuffer), {
          metadata: {
            contentType: file.type,
          },
        });
        
        console.log(`PUT: Arquivo salvo, tornando público...`);
        // Tornar o arquivo público
        await fileRef.makePublic();
        
        // Obter URL pública da imagem
        const publicUrl = getPublicStorageUrl(fileName);
        console.log(`PUT: URL pública gerada: ${publicUrl}`);
        imageUrls[file.name] = publicUrl;
      } catch (error) {
        const uploadError = error as Error;
        console.error(`PUT: Erro no upload: ${uploadError.message}`);
        throw new Error(`Falha no upload da imagem ${file.name}: ${uploadError.message}`);
      }
    }
    
    // Gerar o conteúdo MDX atualizado
    const mdxContent = generateMDXContent({
      title,
      description,
      author,
      date,
      content,
      imageUrls,
    });
    
    // Atualizar o artigo no Firestore usando o ID do documento
    await db.collection('articles').doc(id).update({
      title,
      description,
      author,
      date,
      slug, // Atualizamos o slug também caso tenha mudado
      content: mdxContent,
      imageUrls,
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