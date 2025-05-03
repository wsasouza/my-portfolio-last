import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';

interface ArticleData {
  id?: string;
  title: string;
  description: string;
  author: string;
  date: string;
  slug: string;
  content: string;
  imageUrls: Record<string, string>;
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

export async function POST(request: Request) {
  try {
    const articleData: ArticleData = await request.json();
    
    const { title, description, author, date, slug, content, imageUrls } = articleData;
    
    // Gerar o conteúdo MDX com as URLs já disponíveis
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
    
    const { id, title, description, author, date, slug, content, imageUrls } = articleData;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do artigo é obrigatório para atualização' },
        { status: 400 }
      );
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
    console.error('Erro ao atualizar artigo:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar o artigo' },
      { status: 500 }
    );
  }
} 