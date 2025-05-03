import { db } from '@/lib/firebase-admin';
import { DocumentData } from 'firebase-admin/firestore';

export interface Article {
  title: string;
  description: string;
  author: string;
  date: string;
  content?: string;
  imageUrls?: Record<string, string>;
}

export interface ArticleWithSlug extends Article {
  id: string; // ID do documento
  articleId: string; // ID do artigo (mesmo que o ID do documento)
  slug: string; // slug para URLs amigáveis
}

export interface PaginatedArticles {
  articles: ArticleWithSlug[];
  totalCount: number;
  hasMore: boolean;
}

export async function getAllArticles(): Promise<ArticleWithSlug[]> {
  try {
    const articlesSnapshot = await db.collection('articles')
      .orderBy('date', 'desc')
      .get();
    
    const articles = articlesSnapshot.docs.map((doc: DocumentData) => ({
      slug: doc.id,
      ...doc.data(),
    })) as ArticleWithSlug[];
    
    return articles;
  } catch (error) {
    console.error('Erro ao buscar artigos do Firestore:', error);
    // Fallback para arquivos locais se configuração do Firebase não estiver completa
    return [];
  }
}

export async function getPaginatedArticles(page: number = 1, limit: number = 5): Promise<PaginatedArticles> {
  try {
    // Obter a contagem total (em uma aplicação real, isso seria implementado com uma abordagem mais eficiente)
    const countSnapshot = await db.collection('articles').count().get();
    const totalCount = countSnapshot.data().count;
    
    // Calcular o offset
    const offset = (page - 1) * limit;
    
    // Obter artigos paginados
    const articlesSnapshot = await db.collection('articles')
      .orderBy('date', 'desc')
      .limit(limit)
      .offset(offset)
      .get();
    
    const articles = articlesSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id, // ID do documento
      articleId: doc.id, // ID do artigo
      slug: doc.data().slug, // Usar o slug do documento
      ...doc.data(),
    })) as ArticleWithSlug[];
    
    const hasMore = offset + articles.length < totalCount;
    
    return {
      articles,
      totalCount,
      hasMore
    };
  } catch (error) {
    // Fallback para array vazio
    return {
      articles: [],
      totalCount: 0,
      hasMore: false
    };
  }
}

export async function getArticleBySlug(slug: string): Promise<ArticleWithSlug | null> {
  try {
    // Buscar artigo pelo slug na query
    const articlesQuery = await db.collection('articles')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (articlesQuery.empty) {
      return null;
    }
    
    const articleDoc = articlesQuery.docs[0];
    
    return {
      id: articleDoc.id, // ID do documento
      articleId: articleDoc.id, // ID do artigo (mesmo que o ID do documento)
      ...articleDoc.data(),
    } as ArticleWithSlug;
  } catch (error) {
    console.error('Erro ao buscar artigo do Firestore:', error);
    return null;
  }
}
