'use client'

import { useRecentArticles } from '@/hooks/useArticles'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { formatDate } from '@/lib/formatDate'
import { ArticleWithSlug } from '@/lib/articles'

function Article({ article }: { article: ArticleWithSlug }) {
  return (
    <Card as="article">
      <Card.Title href={`/artigos/${article.slug}`}>
        {article.title}
      </Card.Title>
      <Card.Eyebrow as="time" dateTime={article.date} decorate>
        {formatDate(article.date)}
      </Card.Eyebrow>
      <Card.Description>{article.description}</Card.Description>
      <Card.Cta>Leia o artigo</Card.Cta>
    </Card>
  )
}

export default function RecentArticles() {
  const { data, isLoading, isError } = useRecentArticles()
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }
  
  if (isError) {
    return (
      <div className="text-red-500 dark:text-red-400">
        Erro ao carregar artigos recentes. Por favor, tente novamente mais tarde.
      </div>
    )
  }
  
  const articles = data?.articles || []
  
  return (
    <>
      {articles.map((article) => (
        <Article key={article.slug} article={article} />
      ))}
      {articles.length > 0 && (
        <div className="flex justify-center">
          <Button href="/artigos" variant="secondary">
            Ver todos os artigos
          </Button>
        </div>
      )}
    </>
  )
} 
