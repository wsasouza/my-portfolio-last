import { useQuery } from '@tanstack/react-query';
import { ArticleWithSlug, PaginatedArticles } from '@/lib/articles';

interface FetchArticlesParams {
  page?: number;
  limit?: number;
  tag?: string;
}

async function fetchArticles({ 
  page = 1, 
  limit = 4, 
  tag = '' 
}: FetchArticlesParams): Promise<PaginatedArticles> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  if (tag) {
    params.append('tag', tag);
  }
  
  const response = await fetch(`/api/articles?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar artigos');
  }
  
  return response.json();
}

export function useArticles(options: FetchArticlesParams = {}) {
  return useQuery({
    queryKey: ['articles', options],
    queryFn: () => fetchArticles(options),
  });
}

async function fetchRecentArticles(): Promise<{ articles: ArticleWithSlug[] }> {
  const response = await fetch('/api/articles/recent');
  
  if (!response.ok) {
    throw new Error('Erro ao buscar artigos recentes');
  }
  
  return response.json();
}

export function useRecentArticles() {
  return useQuery({
    queryKey: ['articles', 'recent'],
    queryFn: fetchRecentArticles,
  });
}

async function fetchArticleBySlug(slug: string): Promise<{ article: ArticleWithSlug }> {
  const response = await fetch(`/api/articles/${slug}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar artigo');
  }
  
  return response.json();
}

export function useArticle(slug: string | null) {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: () => fetchArticleBySlug(slug!),
    enabled: !!slug,
  });
} 