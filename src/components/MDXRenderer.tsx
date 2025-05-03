'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prose } from '@/components/Prose';
import NextImage from 'next/image';
import { Code } from '@/components/Code';
import { CodeBlock } from '@/components/CodeBlock';

// Componente básico para imagens
const CustomImage = ({
  src,
  alt = '',
  ...props
}: {
  src?: string;
  alt?: string;
  [key: string]: any;
}) => {
  if (!src) {
    return <span className="text-red-500">Imagem sem URL</span>;
  }

  return (
    <div className="my-8">
      <NextImage
        src={src}
        alt={alt || ''}
        width={800}
        height={500}
        className="rounded-xl w-full h-auto"
      />
    </div>
  );
};

// Componente para links
const CustomLink = ({
  href,
  children,
  ...props
}: {
  href?: string;
  children: React.ReactNode;
  [key: string]: any;
}) => {
  if (!href) return <span>{children}</span>;

  const isExternal = href && (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('www.')
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:underline"
      {...props}
    >
      {children}
    </a>
  );
};

interface MDXRendererProps {
  content: string;
  images?: Record<string, string>;
}

export function MDXRenderer({ content, images = {} }: MDXRendererProps) {
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawContent, setShowRawContent] = useState<boolean>(false);

  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);

      if (!content || typeof content !== 'string') {
        setError('Conteúdo inválido');
        return;
      }

      // Processar o markdown
      let processedContent = removeFrontmatter(content);

      // Remover importações, exportações e outros elementos JSX
      processedContent = processedContent.replace(/^import\s+.*$/gm, '');
      processedContent = processedContent.replace(/^export\s+.*$/gm, '');
      
      // Substituir tags Image do Next.js por markdown padrão
      Object.entries(images).forEach(([filename, url]) => {
        // Corresponder tags Image com URL direta
        processedContent = processedContent.replace(
          new RegExp(`<Image[^>]*src=["']${url}["'][^>]*alt=["']([^"']*)["'][^>]*>`, 'gi'),
          `![${filename}](${url})`
        );
        
        // Corresponder tags Image com variáveis
        processedContent = processedContent.replace(
          new RegExp(`<Image[^>]*src=\\{[^}]+\\}[^>]*>`, 'gi'),
          `![${filename}](${url})`
        );
      });

      console.log('Markdown processado (primeiros 100 caracteres):', processedContent.substring(0, 100));
      setMarkdownContent(processedContent);
    } catch (error: any) {
      console.error('Erro ao processar conteúdo:', error);
      setError(error.message || 'Erro ao processar o conteúdo');
    } finally {
      setIsLoading(false);
    }
  }, [content, images]);

  // Componentes personalizados para ReactMarkdown
  const components: Record<string, any> = {
    img: ({ node, src, alt, ...props }: any) => (
      <CustomImage src={src} alt={alt} {...props} />
    ),
    a: ({ node, href, children, ...props }: any) => (
      <CustomLink href={href} {...props}>{children}</CustomLink>
    ),
    pre: ({ node, ...props }: any) => <CodeBlock {...props} />,
    code: ({ node, inline, ...props }: any) => {
      return inline ? <code {...props} /> : <Code {...props} />;
    },
  };

  if (isLoading) {
    return <div className="text-center py-10">Carregando...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded my-4">
        <p className="font-medium">Erro ao carregar o conteúdo</p>
        <p>{error}</p>

        <div className="mt-4">
          <button
            onClick={() => setShowRawContent(!showRawContent)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            {showRawContent ? 'Ocultar conteúdo' : 'Mostrar conteúdo processado'}
          </button>

          {showRawContent && (
            <div className="mt-2 p-4 bg-gray-100 rounded overflow-auto max-h-96">
              <pre className="text-xs whitespace-pre-wrap">{markdownContent || 'Nenhum conteúdo processado'}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Prose className="mt-8">
      {markdownContent ? (
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={[rehypeRaw]} 
          components={components}
        >
          {markdownContent}
        </ReactMarkdown>
      ) : (
        <p>Nenhum conteúdo disponível</p>
      )}
    </Prose>
  );
}

// Função para remover frontmatter
function removeFrontmatter(content: string): string {
  let processedContent = content;
  
  // 1. Remover frontmatter YAML entre marcadores ---
  if (processedContent.startsWith('---')) {
    const endIndex = processedContent.indexOf('---', 3);
    
    if (endIndex !== -1) {
      // Captura o frontmatter para debug
      const frontmatter = processedContent.substring(3, endIndex);
      console.log('Frontmatter encontrado e removido:', frontmatter);
      
      // Remove o frontmatter
      processedContent = processedContent.substring(endIndex + 3).trim();
    }
  }
  
  // 2. Remover qualquer resíduo de frontmatter que tenha sido renderizado como texto
  const lines = processedContent.split('\n');
  const cleanedLines = [];
  let inFrontmatterSection = false;
  
  // Percorrer as linhas e identificar possíveis frontmatter visíveis
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Verificar se é um marcador de frontmatter
    if (line === '---') {
      inFrontmatterSection = !inFrontmatterSection;
      continue;
    }
    
    // Pular linhas que parecem ser campos de frontmatter
    if (
      line.startsWith('title:') || 
      line.startsWith('description:') || 
      line.startsWith('author:') || 
      line.startsWith('date:') || 
      line.startsWith('slug:') ||
      line.match(/^[a-zA-Z_]+:\s.*$/) // Qualquer linha que pareça ser um campo de frontmatter
    ) {
      console.log('Linha de frontmatter removida:', line);
      continue;
    }
    
    // Adicionar a linha se não for parte do frontmatter
    if (!inFrontmatterSection) {
      cleanedLines.push(lines[i]);
    }
  }
  
  // Remover linhas vazias no início
  while (cleanedLines.length > 0 && cleanedLines[0].trim() === '') {
    cleanedLines.shift();
  }
  
  return cleanedLines.join('\n');
} 