'use client'

import { useArticle } from '@/hooks/useArticles'
import { notFound } from 'next/navigation'
import { Breadcrumb } from '@/components/Breadcrumb'
import { MDXRenderer } from '@/components/MDXRenderer'

interface ArticleDetailProps {
  slug: string
}

export default function ArticleDetail({ slug }: ArticleDetailProps) {
  const { data, isLoading, isError } = useArticle(slug)
  
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-8"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3 mb-2"></div>
          </div>
        </div>
      </div>
    )
  }
  
  if (isError || !data?.article) {
    notFound()
  }
  
  const article = data.article
  const content = article.content || ''
  
  const breadcrumbItems = [
    {
      label: 'Artigos',
      href: '/artigos',
    },
    {
      label: article.title,
      href: `/artigos/${article.slug}`,
    },
  ]
  
  const hasImages = article.imageUrls && Object.keys(article.imageUrls).length > 0
  
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <div className="py-16">       
        <div className="mb-8">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {article.title}
        </h1>
        <div className="mt-2 flex items-center text-sm text-zinc-500 dark:text-zinc-400">
          <span>{article.author}</span>
          <span className="mx-2">•</span>
          <time dateTime={article.date}>
            {new Date(article.date).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
        </div>
        
        {article.tags && article.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span 
                key={tag} 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="mt-8">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {article.description}
          </p>          
          
          {content ? (
            <MDXRenderer 
              content={content} 
              images={article.imageUrls || {}} 
            />
          ) : (
            <div className="mt-8 text-center">
              <p className="text-zinc-500 dark:text-zinc-400">
                O conteúdo deste artigo não está disponível.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
