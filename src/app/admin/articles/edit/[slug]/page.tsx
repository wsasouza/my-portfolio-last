'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ArticleEditor from '@/components/ArticleEditor';

export default function EditArticlePage() {
  const params = useParams();
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        // Buscamos o artigo pelo slug na URL
        const response = await fetch(`/api/articles/${params.slug}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar artigo');
        }
        
        // O artigo agora contém o ID do documento e o slug
        setArticle(data.article);
      } catch (err: any) {
        setError(err.message);
        console.error('Erro ao buscar artigo:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (params.slug) {
      fetchArticle();
    }
  }, [params.slug]);

  if (isLoading) {
    return <div className="container mx-auto py-8 px-4">Carregando...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      </div>
    );
  }

  return <ArticleEditor article={article} />;
} 