import { notFound } from 'next/navigation';
import { getArticleBySlug } from '@/lib/articles';
import { Metadata } from 'next';
import { Prose } from '@/components/Prose';
import { MDXRenderer } from '@/components/MDXRenderer';
import { debugMDXContent } from '@/utils/debug-mdx';

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

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticleBySlug(params.slug);
  
  if (!article) {
    notFound();
  }
  
  // Extrair o conteúdo do artigo do MDX armazenado
  const content = article.content || '';
  
  // Debug do conteúdo MDX
  if (process.env.NODE_ENV !== 'production') {
    const debug = debugMDXContent(content);
    console.log('Debug do conteúdo MDX:', {
      articleId: article.id,
      slug: article.slug,
      contentLength: content.length,
      format: content.includes('import { ArticleLayout }') ? 'antigo' : 'novo',
      hasFrontmatter: content.startsWith('---'),
      frontmatter: debug.info.frontmatter,
      ...debug.info
    });
    
    if (debug.warnings.length > 0) {
      console.warn('Avisos de MDX:', debug.warnings);
    }
  }
  
  // Verificar se temos alguma imagem disponível
  const hasImages = article.imageUrls && Object.keys(article.imageUrls).length > 0;
  
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <div className="py-16">
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
        
        <div className="mt-8">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {article.description}
          </p>
          
          {/* Renderizador MDX */}
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
          
          {/* Debug para desenvolvimento */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-16 p-4 border border-zinc-200 rounded-lg dark:border-zinc-700 text-xs font-mono">
              <details>
                <summary className="cursor-pointer text-zinc-500 dark:text-zinc-400">
                  Debug (apenas em desenvolvimento)
                </summary>
                <div className="mt-2 overflow-auto max-h-60">
                  <p>ID: {article.id}</p>
                  <p>Slug: {article.slug}</p>
                  <p>Autor: {article.author}</p>
                  <p>Data: {article.date}</p>
                  <p>Comprimento do conteúdo: {content.length} caracteres</p>
                  <p>Imagens: {hasImages ? Object.keys(article.imageUrls || {}).length : 0}</p>
                  
                  {/* Debug de frontmatter */}
                  <details className="mt-2 mb-2">
                    <summary className="cursor-pointer text-zinc-500">Frontmatter</summary>
                    <div className="pl-4 mt-1 border-l-2 border-zinc-200 dark:border-zinc-700">
                      {(() => {
                        const debug = debugMDXContent(content);
                        const frontmatter = debug.info.frontmatter;
                        
                        if (!frontmatter || !frontmatter.exists) {
                          return <p>Nenhum frontmatter detectado</p>;
                        }
                        
                        return (
                          <>
                            {frontmatter.title && <p>Title: {frontmatter.title}</p>}
                            {frontmatter.description && <p>Description: {frontmatter.description}</p>}
                            {frontmatter.author && <p>Author: {frontmatter.author}</p>}
                            {frontmatter.date && <p>Date: {frontmatter.date}</p>}
                            <details>
                              <summary>Raw</summary>
                              <pre className="text-xs bg-zinc-100 dark:bg-zinc-800 p-1 rounded mt-1 overflow-auto">
                                {frontmatter.raw}
                              </pre>
                            </details>
                          </>
                        );
                      })()}
                    </div>
                  </details>
                  
                  {/* Alertas de MDX */}
                  {(() => {
                    const debug = debugMDXContent(content);
                    if (debug.warnings.length === 0) return null;
                    
                    return (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-amber-500">
                          Avisos MDX ({debug.warnings.length})
                        </summary>
                        <ul className="list-disc pl-5 mt-1">
                          {debug.warnings.map((warning, i) => (
                            <li key={i} className="text-amber-600 dark:text-amber-400">{warning}</li>
                          ))}
                        </ul>
                      </details>
                    );
                  })()}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 