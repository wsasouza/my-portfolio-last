import { NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase-admin';

// Handler para GET - Buscar um artigo pelo slug (na URL) mas usar o ID internamente
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug não fornecido' },
        { status: 400 }
      );
    }
    
    const articlesQuery = await db.collection('articles')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (articlesQuery.empty) {
      return NextResponse.json(
        { error: 'Artigo não encontrado' },
        { status: 404 }
      );
    }
    
    const articleDoc = articlesQuery.docs[0];
    
    const article = {
      id: articleDoc.id,
      ...articleDoc.data(),
    };
    
    return NextResponse.json({ article });
  } catch (error) {
    console.error('Erro ao buscar artigo do Firestore:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar artigo' },
      { status: 500 }
    );
  }
}

// Handler para DELETE - Remover um artigo pelo slug (na URL) mas usar o ID internamente
export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;    
    
    const articlesQuery = await db.collection('articles')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (articlesQuery.empty) {
      return NextResponse.json(
        { error: 'Artigo não encontrado' },
        { status: 404 }
      );
    }
    
    const articleDoc = articlesQuery.docs[0];
    const articleId = articleDoc.id;
    const articleData = articleDoc.data();    
    
    if (articleData?.imageUrls) {
      const imageUrls = articleData.imageUrls as Record<string, string>;
      
      for (const [_, url] of Object.entries(imageUrls)) {
        try {          
          const filePathMatch = url.match(/\/articles\/[^/]+\/[^/]+$/);
          
          if (filePathMatch) {            
            const filePath = filePathMatch[0].substring(1);
            const fileRef = storage.bucket().file(filePath);            
            
            const [exists] = await fileRef.exists();
            
            if (exists) {
              await fileRef.delete();
            }
          }
        } catch (fileError) {
          console.error('Erro ao excluir arquivo:', fileError);          
        }
      }
    }    
    
    await db.collection('articles').doc(articleId).delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir artigo:', error);
    return NextResponse.json(
      { error: 'Falha ao excluir artigo' },
      { status: 500 }
    );
  }
} 
