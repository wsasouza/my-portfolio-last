'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/formatDate';
import { SimpleLayout } from '@/components/SimpleLayout';
import { Pagination } from '@/components/Pagination';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Article {
  id: string;   
  slug: string; 
  title: string;
  description: string;
  author: string;
  date: string;
  tags?: string[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 5,
    totalCount: 0,
    totalPages: 1,
    hasMore: false
  });
  
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('pagina') || '1', 10);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/articles?page=${currentPage}&limit=5`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar artigos');
        }
        
        setArticles(data.articles);
        setPagination(data.pagination);
      } catch (err: any) {
        setError(err.message);
        console.error('Erro ao buscar artigos:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticles();
  }, [currentPage]);

  const handleDeleteArticle = async (slug: string, id: string) => {
    if (!confirm('Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {      
      const response = await fetch(`/api/articles/${slug}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir artigo');
      }
            
      setArticles(articles.filter(article => article.id !== id));
            
      setPagination(prev => ({
        ...prev,
        totalCount: prev.totalCount - 1,
        totalPages: Math.ceil((prev.totalCount - 1) / prev.limit)
      }));
    } catch (err: any) {
      alert(`Erro ao excluir artigo: ${err.message}`);
      console.error('Erro ao excluir artigo:', err);
    }
  };

  return (
    <SimpleLayout
      title="Gerenciamento de Artigos"
      intro="Aqui você pode criar, editar e excluir artigos do blog."
    >
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Gerenciar Artigos</h1>
          <Link 
            href="/admin/gerenciar-artigos/novo" 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Novo Artigo
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Carregando artigos...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                <thead className="bg-gray-50 dark:bg-zinc-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-300 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-300 uppercase tracking-wider">
                      Autor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-300 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-zinc-300 uppercase tracking-wider w-[200px]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
                  {articles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-zinc-400">
                        Nenhum artigo encontrado.
                      </td>
                    </tr>
                  ) : (
                    articles.map((article) => (
                      <tr key={article.slug}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {article.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2 max-w-[300px]">
                            {article.description}
                          </div>
                          {article.tags && article.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {article.tags.map((tag) => (
                                <span 
                                  key={tag} 
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                          {article.author}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                          {formatDate(article.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex flex-wrap justify-end gap-3">
                            <Link
                              href={`/admin/gerenciar-artigos/editar/${article.slug}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900"
                            >
                              Editar
                            </Link>
                            <Link
                              href={`/artigos/${article.slug}`}
                              className="text-green-600 dark:text-green-400 hover:text-green-900"
                              target="_blank"
                            >
                              Visualizar
                            </Link>
                            <button
                              onClick={() => handleDeleteArticle(article.slug, article.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}      
        
        <Pagination 
          currentPage={pagination.page} 
          totalPages={pagination.totalPages} 
        />
      </div>
    </SimpleLayout>
  );
} 