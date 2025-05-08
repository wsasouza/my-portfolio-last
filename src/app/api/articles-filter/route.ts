import { NextResponse } from 'next/server';
import { getPaginatedArticles } from '@/lib/articles';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '4', 10);
    const tag = url.searchParams.get('tag') || '';

    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 20);
    
    const result = await getPaginatedArticles(validatedPage, validatedLimit, tag || undefined);
    
    return NextResponse.json({
      articles: result.articles,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        totalCount: result.totalCount,
        totalPages: Math.ceil(result.totalCount / validatedLimit),
        hasMore: result.hasMore
      }
    });
  } catch (error) {
    console.error('Erro ao buscar artigos filtrados:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar artigos' },
      { status: 500 }
    );
  }
} 