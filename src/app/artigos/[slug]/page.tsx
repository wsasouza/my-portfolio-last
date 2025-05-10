import { Metadata } from 'next';
import { getArticleBySlug } from '@/lib/articles';
import ArticleDetail from '@/components/ArticleDetail';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  
  if (!article) {
    return {
      title: 'Artigo não encontrado',
      description: 'O artigo que você está procurando não existe.',
    };
  }
  
  return {
    title: article.title,
    description: article.description,
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  return <ArticleDetail slug={params.slug} />;
} 
