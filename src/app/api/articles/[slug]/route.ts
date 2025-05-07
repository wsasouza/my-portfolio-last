import { NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase-admin';

// Handler para GET - Buscar um artigo pelo slug (na URL) mas usar o ID internamente
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    // Buscar artigo pelo slug na query
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
      id: articleDoc.id, // ID do documento
      articleId: articleDoc.id, // ID do artigo (mesmo que o ID do documento)
      ...articleDoc.data(),
    };
    
    return NextResponse.json({ article });
  } catch (error) {
    console.error('Erro ao buscar artigo:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar artigo' },
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
    
    // Buscar artigo pelo slug na query
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
    
    // Excluir imagens associadas ao artigo do Storage
    if (articleData?.imageUrls) {
      const imageUrls = articleData.imageUrls as Record<string, string>;
      
      for (const [_, url] of Object.entries(imageUrls)) {
        try {
          // Extrair o caminho do arquivo da URL do Firebase Storage
          const filePathMatch = url.match(/\/articles\/[^/]+\/[^/]+$/);
          
          if (filePathMatch) {
            // Remover a barra inicial para obter um caminho relativo
            const filePath = filePathMatch[0].substring(1);
            const fileRef = storage.bucket().file(filePath);
            
            // Verificar se o arquivo existe
            const [exists] = await fileRef.exists();
            
            if (exists) {
              await fileRef.delete();
            }
          }
        } catch (fileError) {
          console.error('Erro ao excluir arquivo:', fileError);
          // Continuar mesmo com erro para tentar excluir outros arquivos
        }
      }
    }
    
    // Excluir o documento do artigo no Firestore usando o ID do documento
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