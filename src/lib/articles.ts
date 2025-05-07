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
  id: string; 
  slug: string; 
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
      id: doc.id,
      slug: doc.data().slug,
      ...doc.data(),
    })) as ArticleWithSlug[];
    
    return articles;
  } catch (error) {
    console.error('Erro ao buscar artigos do Firestore:', error);    
    return [];
  }
}

export async function getPaginatedArticles(page: number = 1, limit: number = 4): Promise<PaginatedArticles> {
  try {    
    const countSnapshot = await db.collection('articles').count().get();
    const totalCount = countSnapshot.data().count;    
    
    const offset = (page - 1) * limit;    
    
    const articlesSnapshot = await db.collection('articles')
      .orderBy('date', 'desc')
      .limit(limit)
      .offset(offset)
      .get();
    
    const articles = articlesSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id, 
      slug: doc.data().slug, 
      ...doc.data(),
    })) as ArticleWithSlug[];
    
    const hasMore = offset + articles.length < totalCount;
    
    return {
      articles,
      totalCount,
      hasMore
    };
  } catch (error) {
    console.error('Erro ao buscar artigos paginados do Firestore:', error);
    return {
      articles: [],
      totalCount: 0,
      hasMore: false
    };
  }
}

export async function getArticleBySlug(slug: string): Promise<ArticleWithSlug | null> {
  try {    
    const articlesQuery = await db.collection('articles')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (articlesQuery.empty) {
      return null;
    }
    
    const articleDoc = articlesQuery.docs[0];
    
    return {
      id: articleDoc.id, 
      ...articleDoc.data(),
    } as ArticleWithSlug;
  } catch (error) {
    console.error('Erro ao buscar artigo do Firestore:', error);
    return null;
  }
}
