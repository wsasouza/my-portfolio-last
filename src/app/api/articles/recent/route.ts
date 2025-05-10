import { db } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { DocumentData } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const limit = 4;
    
    const articlesSnapshot = await db.collection('articles')
      .orderBy('date', 'desc')
      .limit(limit)
      .get();
    
    const articles = articlesSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      slug: doc.data().slug,
      ...doc.data(),
    }));
    
    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Erro ao buscar artigos recentes do Firestore:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar artigos recentes' },
      { status: 500 }
    );
  }
} 