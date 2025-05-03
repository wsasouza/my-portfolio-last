'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/formatDate';
import { SimpleLayout } from '@/components/SimpleLayout';

interface Article {
  id: string; // ID do documento
  articleId: string; // ID do artigo (mesmo que o ID do documento)
  slug: string; // slug para URLs amigáveis
  title: string;
  description: string;
  author: string;
  date: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/articles');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar artigos');
        }
        
        setArticles(data.articles);
      } catch (err: any) {
        setError(err.message);
        console.error('Erro ao buscar artigos:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticles();
  }, []);

  const handleDeleteArticle = async (slug: string, id: string) => {
    if (!confirm('Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      // Usamos o slug para a URL da API, mas podemos usar o ID internamente
      const response = await fetch(`/api/articles/${slug}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir artigo');
      }
      
      // Atualizar a lista após excluir
      setArticles(articles.filter(article => article.id !== id));
    } catch (err: any) {
      alert(`Erro ao excluir artigo: ${err.message}`);
      console.error('Erro ao excluir artigo:', err);
    }
  };

  return (
    <SimpleLayout
      title="I’ve spoken at events all around the world and been interviewed for many podcasts."
      intro="One of my favorite ways to share my ideas is live on stage, where there’s so much more communication bandwidth than there is in writing, and I love podcast interviews because they give me the opportunity to answer questions instead of just present my opinions."
    >      
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Gerenciar Artigos</h1>
        <Link 
          href="/admin/articles/new" 
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-zinc-300 uppercase tracking-wider">
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
                      <div className="text-sm text-gray-500 dark:text-zinc-400 truncate max-w-md">
                        {article.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                      {article.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                      {formatDate(article.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/articles/edit/${article.slug}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/articles/${article.slug}`}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 mr-4"
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </SimpleLayout>
  );
} 