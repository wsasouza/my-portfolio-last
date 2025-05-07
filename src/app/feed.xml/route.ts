import { getAllArticles } from '@/lib/articles'
import { Feed } from 'feed'

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!siteUrl) {
    throw Error('Missing NEXT_PUBLIC_SITE_URL environment variable')
  }

  const author = {
    name: 'Walter Santos de Andrade Souza',
    email: 'upwebstudiobr@gmail.com',
  }

  const feed = new Feed({
    title: author.name,
    description: 'Desenvolvedor Full Stack',
    author,
    id: siteUrl,
    link: siteUrl,
    image: `${siteUrl}/favicon.ico`,
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `Todos os direitos reservados ${new Date().getFullYear()}`,
    feedLinks: {
      rss2: `${siteUrl}/feed.xml`,
    },
  })

  const articles = await getAllArticles()

  for (const article of articles) {
    const publicUrl = `${siteUrl}/artigos/${article.slug}`
    feed.addItem({
      title: article.title,
      id: publicUrl,
      link: publicUrl,
      content: article.content || article.description || '',
      author: [author],
      contributor: [author],
      date: new Date(article.date),
    })
  }

  return new Response(feed.rss2(), {
    status: 200,
    headers: {
      'content-type': 'application/xml',
      'cache-control': 's-maxage=31556952',
    },
  })
}
