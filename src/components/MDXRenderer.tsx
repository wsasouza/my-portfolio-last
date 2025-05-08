'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prose } from '@/components/Prose';
import NextImage from 'next/image';
import { CodeBlock } from '@/components/CodeBlock';
import { normalizeMDXContent } from '@/utils/mdx-utils';

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
  
  const imageUrl = src.startsWith('/') || src.startsWith('http') 
    ? src 
    : `/${src}`;

  try {
    return (
      <span className="block my-8">
        <NextImage
          src={imageUrl}
          alt={alt || ''}
          width={800}
          height={500}
          priority
          className="rounded-xl w-full h-auto"
          unoptimized={src.startsWith('http')}
        />
      </span>
    );
  } catch (error) {
    console.error(`Erro ao renderizar imagem: ${src}`, error);
   
    return (
      <span className="block my-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={imageUrl} 
          alt={alt || ''} 
          className="rounded-xl w-full h-auto" 
        />
      </span>
    );
  }
};

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
      
      let processedContent = removeFrontmatter(content);
     
      processedContent = normalizeMDXContent(processedContent);
     
      processedContent = processedContent.replace(/^import\s+.*$/gm, '');
      processedContent = processedContent.replace(/^export\s+.*$/gm, '');      
      
      Object.entries(images).forEach(([filename, url]) => {
        if (!url) {
          console.warn(`URL não fornecida para a imagem: ${filename}`);
          return;
        }

        try {         
          processedContent = processedContent.replace(
            new RegExp(`<Image[^>]*src=["']${url}["'][^>]*alt=["']([^"']*)["'][^>]*>`, 'gi'),
            `![${filename}](${url})`
          );          
          
          processedContent = processedContent.replace(
            new RegExp(`<Image[^>]*src=\\{[^}]+\\}[^>]*>`, 'gi'),
            `![${filename}](${url})`
          );
          
          processedContent = processedContent.replace(
            new RegExp(`!\\[(.*?)\\]\\(${filename}\\)`, 'gi'),
            `![${filename}](${url})`
          );
        } catch (regexError) {
          console.error(`Erro ao processar regex para imagem ${filename}:`, regexError);
        }
      });
      
      setMarkdownContent(processedContent);
    } catch (error: any) {
      console.error('Erro ao processar conteúdo:', error);
      setError(error.message || 'Erro ao processar o conteúdo');
    } finally {
      setIsLoading(false);
    }
  }, [content, images]);
  
  const components = {    
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    h4: ({ children, ...props }: any) => <h4 {...props}>{children}</h4>,
    h5: ({ children, ...props }: any) => <h5 {...props}>{children}</h5>,
    h6: ({ children, ...props }: any) => <h6 {...props}>{children}</h6>,
    ul: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    ol: ({ children, ...props }: any) => <ol {...props}>{children}</ol>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    blockquote: ({ children, ...props }: any) => <blockquote {...props}>{children}</blockquote>,    
    
    img: ({ node, src, alt, ...props }: any) => {
      if (!src) return null;
      return <CustomImage src={src} alt={alt} {...props} />;
    },
    
    a: ({ node, href, children, ...props }: any) => {
      if (!href) return <span>{children}</span>;
      return <CustomLink href={href} {...props}>{children}</CustomLink>;
    },
    
    pre: ({ node, children, className, ...props }: any) => {     
      let codeInfo = null;      
      
      if (node && node.children && node.children[0] && node.children[0].tagName === 'code') {
        const codeNode = node.children[0];        
        
        if (codeNode.properties) {
          if (codeNode.properties.className) {
            const langClass = codeNode.properties.className.find((cls: string) => 
              cls.startsWith('language-')
            );
            
            if (langClass) {
              codeInfo = {
                language: langClass.replace('language-', ''),
                className: langClass
              };
            }
          }          
          
          if (codeNode.data && codeNode.data.meta) {
            codeInfo = {
              ...codeInfo,
              metastring: codeNode.data.meta
            };
          }
        }
      }      
      
      const metastring = codeInfo?.metastring || props['data-meta'] || '';
      const language = codeInfo?.language || '';
      
      return (
        <CodeBlock 
          metastring={metastring} 
          className={codeInfo?.className || className || ''} 
          language={language}
          {...props}
        >
          {children}
        </CodeBlock>
      );
    },
    
    code: ({ node, inline, className, children, ...props }: any) => {    
      if (inline) {
        return <code className={className} {...props}>{children}</code>;
      }
      
      let language = '';
      let metastring = '';      
      
      if (className && className.includes('language-')) {
        language = className.replace('language-', '');
      }      
      
      if (node && node.properties) {
        metastring = node.properties['data-meta'] || '';
      }      
    
      if (!metastring) {
        metastring = props['data-meta'] || props['data-language'] || '';
      }
      
      if (node && node.data && node.data.meta) {
        metastring = node.data.meta;
      }
      
      return (
        <CodeBlock 
          className={className} 
          language={language} 
          metastring={metastring}
          {...props}
        >
          {children}
        </CodeBlock>
      );
    }
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
        <div className="mdx-content">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeRaw]} 
            components={components}
            skipHtml={false}
          >
            {markdownContent}
          </ReactMarkdown>
        </div>
      ) : (
        <p>Nenhum conteúdo disponível</p>
      )}
    </Prose>
  );
}

function removeFrontmatter(content: string): string {
  let processedContent = content;  
  
  if (processedContent.startsWith('---')) {
    const endIndex = processedContent.indexOf('---', 3);
    
    if (endIndex !== -1) {      
      const frontmatter = processedContent.substring(3, endIndex);
      console.log('Frontmatter encontrado e removido:', frontmatter);      
    
      processedContent = processedContent.substring(endIndex + 3).trim();
    }
  }  
  
  const lines = processedContent.split('\n');
  const cleanedLines = [];
  let inFrontmatterSection = false;  
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();    
    
    if (line === '---') {
      inFrontmatterSection = !inFrontmatterSection;
      continue;
    }    
    
    if (
      line.startsWith('title:') || 
      line.startsWith('description:') || 
      line.startsWith('author:') || 
      line.startsWith('date:') || 
      line.startsWith('slug:') ||
      line.match(/^[a-zA-Z_]+:\s.*$/)
    ) {      
      continue;
    }    
    
    if (!inFrontmatterSection) {
      cleanedLines.push(lines[i]);
    }
  }  
  
  while (cleanedLines.length > 0 && cleanedLines[0].trim() === '') {
    cleanedLines.shift();
  }
  
  return cleanedLines.join('\n');
} 
