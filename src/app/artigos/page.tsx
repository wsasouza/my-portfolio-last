'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import { Breadcrumb } from '@/components/Breadcrumb'
import { type ArticleWithSlug } from '@/lib/articles'
import { formatDate } from '@/lib/formatDate'
import { Pagination } from '@/components/Pagination'

const breadcrumbItems = [
  {
    label: 'Artigos',
    href: '/artigos',
  }
]

function Article({ article }: { article: ArticleWithSlug }) {
  return (
    <article className="md:grid md:grid-cols-4 md:items-baseline">
      <Card className="md:col-span-3">
        <Card.Title href={`/artigos/${article.slug}`}>
          {article.title}
        </Card.Title>
        <Card.Eyebrow
          as="time"
          dateTime={article.date}
          className="md:hidden"
          decorate
        >
          {formatDate(article.date)}
        </Card.Eyebrow>
        <Card.Description>{article.description}</Card.Description>
        {article.tags && article.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span 
                key={tag} 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                onClick={() => window.location.href = `/artigos?tag=${encodeURIComponent(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <Card.Cta>Ler artigo</Card.Cta>
      </Card>
      <Card.Eyebrow
        as="time"
        dateTime={article.date}
        className="mt-1 max-md:hidden"
      >
        {formatDate(article.date)}
      </Card.Eyebrow>
    </article>
  )
}

function SearchIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.25 3.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export default function ArticlesIndex() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const pageParam = searchParams.get('pagina');
  const tagParam = searchParams.get('tag');
  
  const [currentPage, setCurrentPage] = useState(
    typeof pageParam === 'string' ? parseInt(pageParam, 10) || 1 : 1
  );
  const [tagFilter, setTagFilter] = useState(tagParam || '');
  const [inputValue, setInputValue] = useState(tagParam || '');
  const [articles, setArticles] = useState<ArticleWithSlug[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const totalPages = Math.ceil(totalCount / 4);

  useEffect(() => {
    async function fetchArticles() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/articles-filter?page=${currentPage}&limit=4${tagFilter ? `&tag=${encodeURIComponent(tagFilter)}` : ''}`);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar artigos');
        }
        
        const data = await response.json();
        setArticles(data.articles);
        setTotalCount(data.pagination.totalCount);
      } catch (error) {
        console.error('Erro ao buscar artigos:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchArticles();
  }, [currentPage, tagFilter]);

  useEffect(() => {
    // Atualizar os parâmetros de URL quando o estado mudar
    const params = new URLSearchParams();
    if (currentPage > 1) {
      params.set('pagina', currentPage.toString());
    }
    if (tagFilter) {
      params.set('tag', tagFilter);
    }
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl);
  }, [currentPage, tagFilter, pathname, router]);

  // Quando os params da URL mudam externamente
  useEffect(() => {
    if (pageParam) {
      const newPage = parseInt(pageParam, 10) || 1;
      setCurrentPage(newPage);
    } else {
      setCurrentPage(1);
    }
    
    if (tagParam !== null) {
      setTagFilter(tagParam);
      setInputValue(tagParam);
    }
  }, [pageParam, tagParam]);

  const handleTagSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTagFilter(inputValue.trim().toLowerCase());
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setTagFilter('');
    setInputValue('');
    setCurrentPage(1);
  };

  return (
    <SimpleLayout
      title="Escrevendo sobre desenvolvimento e tecnologias que venho explorando."
      intro="Registro dos meus aprendizados enquanto estudo frameworks, ferramentas e boas práticas de desenvolvimento"
    >
      {/* Breadcrumb */}
      <div className="mb-8">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      
      {/* Search box */}
      <div className="mb-8">
        <form onSubmit={handleTagSearch} className="relative max-w-md">
          <label htmlFor="tag-input" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Filtrar por tag
          </label>
          <div className="relative">
            <input
              id="tag-input"
              type="text"
              placeholder="Ex. Frontend, Backend, etc."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm shadow-sm dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
              aria-label="Pesquisar"
            >
              <SearchIcon className="w-6 h-6" />
            </button>
          </div>
          
          {tagFilter && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {totalCount} {totalCount === 1 ? 'artigo encontrado' : 'artigos encontrados'} com a tag &quot;{tagFilter}&quot;
              </span>
              <button
                onClick={handleClearFilter}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Limpar filtro
              </button>
            </div>
          )}
        </form>
      </div>
      
      <div className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-zinc-500 dark:text-zinc-400">
              Carregando artigos...
            </div>
          </div>
        ) : (
          <>
            <div className="flex max-w-3xl flex-col space-y-16">
              {articles.map((article) => (
                <Article key={article.slug} article={article} />
              ))}
            </div>        
           
            {articles.length === 0 && (
              <p className="text-center text-zinc-500 dark:text-zinc-400 mt-10">
                {tagFilter 
                  ? `Nenhum artigo encontrado com a tag &quot;${tagFilter}&quot;.`
                  : 'Nenhum artigo encontrado.'
                }
              </p>
            )}
          </>
        )}
       
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
        />
      </div>
    </SimpleLayout>
  )
}
