import { type Metadata } from 'next'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import { type ArticleWithSlug, getPaginatedArticles } from '@/lib/articles'
import { formatDate } from '@/lib/formatDate'
import { Pagination } from '@/components/Pagination'

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

export const metadata: Metadata = {
  title: 'Artigos',
  description:
    'Meus pensamentos sobre programação, design, liderança, e mais, coletados em ordem cronológica.',
}

interface ArticlesPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ArticlesIndex({ searchParams }: ArticlesPageProps) {
  // Obter o número da página a partir dos parâmetros da URL
  const pageParam = searchParams.pagina;
  const currentPage = typeof pageParam === 'string' 
    ? parseInt(pageParam, 10) || 1 
    : 1;
  
  // Obter artigos paginados (5 por página)
  const { articles, totalCount, hasMore } = await getPaginatedArticles(currentPage, 5);
  
  // Calcular o número total de páginas
  const totalPages = Math.ceil(totalCount / 5);

  return (
    <SimpleLayout
      title="Escrevendo sobre design de software, desenvolvimento, e tecnologia."
      intro="Meus pensamentos sobre programação, design, liderança, e mais, coletados em ordem cronológica."
    >
      <div className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
        <div className="flex max-w-3xl flex-col space-y-16">
          {articles.map((article) => (
            <Article key={article.slug} article={article} />
          ))}
        </div>
        
        {/* Exibir mensagem se não houver artigos */}
        {articles.length === 0 && (
          <p className="text-center text-zinc-500 dark:text-zinc-400 mt-10">
            Nenhum artigo encontrado.
          </p>
        )}
        
        {/* Componente de paginação */}
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
        />
      </div>
    </SimpleLayout>
  )
}
