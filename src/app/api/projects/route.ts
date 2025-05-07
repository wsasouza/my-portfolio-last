import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { Project } from '@/types/projects';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '6', 10);
    const validatedLimit = Math.min(Math.max(1, limit), 20);
    const validatedPage = Math.max(1, page);
    const offset = (validatedPage - 1) * validatedLimit;

    const countSnapshot = await db.collection('projects').count().get();
    const totalCount = countSnapshot.data().count;

    const projectsSnapshot = await db.collection('projects')
      .orderBy('name', 'asc')
      .limit(validatedLimit)
      .offset(offset)
      .get();

    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const hasMore = offset + projects.length < totalCount;

    return NextResponse.json({
      projects,
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
      { error: 'Falha ao buscar projetos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const projectData: Project = await request.json();
    const { name, description, link, logo, tags } = projectData;
    const projectRef = db.collection('projects').doc();
    const documentId = projectRef.id;
    await projectRef.set({
      name,
      description,
      link,
      logo,
      tags,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true, id: documentId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao salvar o projeto' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const projectData: Project & { id: string } = await request.json();
    const { id, name, description, link, logo, tags } = projectData;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do projeto é obrigatório para atualização' },
        { status: 400 }
      );
    }
    
    const projectDoc = await db.collection('projects').doc(id).get();
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }
        
    await db.collection('projects').doc(id).update({
      name,
      description,
      link,
      logo,
      tags,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar o projeto' },
      { status: 500 }
    );
  }
} 