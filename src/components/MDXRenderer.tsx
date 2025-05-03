'use client';

import { useState, useEffect } from 'react';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import rehypePrism from '@mapbox/rehype-prism';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { Prose } from '@/components/Prose';
import NextImage from 'next/image';
import { Code } from '@/components/Code';
import { CodeBlock } from '@/components/CodeBlock';
import { normalizeMDXContent, processImageReferences } from '@/utils/mdx-utils';
import type { MDXComponents } from 'mdx/types';

// Função auxiliar para fazer logging seguro de objetos React (evita referências circulares)
function safeLogObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // Cria um objeto simples com propriedades seguras
  const safeObj: Record<string, any> = {};
  
  try {
    // Extrair apenas propriedades simples para evitar referências circulares
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (key === 'children' || key === '_owner' || key === '_store' || key === '_self' || key === '_source') {
          // Estas propriedades tendem a causar referências circulares
          safeObj[key] = typeof value;
        } else if (typeof value !== 'object' || value === null) {
          // Para valores simples (string, number, boolean, null)
          safeObj[key] = value;
        } else if (Array.isArray(value)) {
          // Para arrays, indicamos apenas o tipo e tamanho
          safeObj[key] = `Array(${value.length})`;
        } else {
          // Para outros objetos, indicamos apenas o tipo
          safeObj[key] = `${typeof value}`;
        }
      }
    }
    
    // Adicionar properties do tipo se disponíveis
    if (obj.type && typeof obj.type === 'string') {
      safeObj.type = obj.type;
    } else if (obj.type && typeof obj.type === 'function') {
      safeObj.type = obj.type.name || 'FunctionComponent';
    }
    
    return safeObj;
  } catch (err) {
    // Em caso de erro, retorna um objeto seguro mínimo
    return { error: 'Não foi possível serializar o objeto', objectType: typeof obj };
  }
}

// Componente Image adaptado para MDX
const Image = (props: any) => {
  const { src, alt = '', caption, width, height, ...rest } = props;
  
  // Certifique-se de que src seja uma string válida
  if (!src) {
    console.error('Erro: Componente Image chamado sem o atributo src');
    return null;
  }
  
  try {
    return (
      <>
        <NextImage 
          src={src}
          alt={alt}
          width={width || 1200}
          height={height || 800}
          sizes="(min-width: 1280px) 36rem, (min-width: 1024px) 45vw, (min-width: 640px) 32rem, 95vw"
          quality={90}
          className="rounded-2xl my-8 w-full h-auto"
          {...rest}
        />
        {caption && (
          <span className="block mt-2 text-sm text-center text-zinc-500 dark:text-zinc-400">
            {caption}
          </span>
        )}
      </>
    );
  } catch (error) {
    console.error('Erro ao renderizar componente Image:', error, { props });
    return <span className="text-red-500">Erro ao carregar imagem</span>;
  }
};

// Wrapper para o componente Code para compatibilidade com MDX
const CodeWrapper = (props: any) => {
  // Log para debugging (apenas em desenvolvimento)
  if (process.env.NODE_ENV !== 'production') {
    console.log('DEBUG Code props:', { 
      className: props.className, 
      childrenType: typeof props.children,
      // Usar uma forma segura para logar as propriedades
      childrenInfo: props.children ? safeLogObject(props.children) : null
    });
  }
  return <Code {...props} />;
};

// Wrapper para o componente CodeBlock para compatibilidade com MDX
const PreWrapper = (props: any) => {
  // Log para debugging (apenas em desenvolvimento)
  if (process.env.NODE_ENV !== 'production') {
    console.log('DEBUG Pre props:', { 
      className: props.className, 
      childrenType: typeof props.children,
      // Usar uma forma segura para logar as propriedades
      childrenInfo: props.children ? safeLogObject(props.children) : null
    });
  }
  return <CodeBlock {...props} />;
};

// Componente Link personalizado para MDX
const CustomLink = (props: any) => {
  const { href, children, ...rest } = props;
  
  // Verificar se é um link externo
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
        {...rest}
      >
        {children}
      </a>
    );
  }
  
  // Link interno
  return (
    <a 
      href={href} 
      className="text-blue-600 dark:text-blue-400 hover:underline"
      {...rest}
    >
      {children}
    </a>
  );
};

interface MDXRendererProps {
  content: string;
  images?: Record<string, string>;
}

// Função auxiliar para debug de conteúdo
function debugContent(label: string, content: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${label} (${content.length} caracteres): "${content.substring(0, 100).replace(/\n/g, '\\n')}"...`);
    
    // Procurar por blocos de código e logar
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    if (codeBlocks.length > 0) {
      console.log(`Encontrados ${codeBlocks.length} blocos de código:`);
      codeBlocks.forEach((block, i) => {
        console.log(`  Bloco ${i + 1}:`, block.substring(0, 100).replace(/\n/g, '\\n') + (block.length > 100 ? '...' : ''));
      });
    }
  }
}

export function MDXRenderer({ content, images = {} }: MDXRendererProps) {
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const processMDX = async () => {
      try {
        setIsLoading(true);
        setError(null); // Limpar erros anteriores
        
        if (!content) {
          setError('Conteúdo do artigo não disponível.');
          return;
        }
        
        // Registrar informações iniciais
        console.log(`Processando MDX (comprimento: ${content.length})`);
        debugContent('Conteúdo original', content);
        
        // Etapa 1: Verificar o formato do conteúdo
        // O conteúdo pode estar em dois formatos:
        // 1. Formato antigo (com importações e ArticleLayout)
        // 2. Formato novo (com frontmatter YAML simples)
        let processedContent = content;
        let formatInfo: { 
          isOldFormat: boolean; 
          extractionMethod: string | null;
          hasFrontmatter: boolean;
          frontmatterRemoved: boolean;
        } = { 
          isOldFormat: false, 
          extractionMethod: null,
          hasFrontmatter: false,
          frontmatterRemoved: false
        };

        // Se conteúdo contém importações e ArticleLayout, é formato antigo
        const isOldFormat = content.includes('import { ArticleLayout }') || 
                           content.includes('export default (props) => <ArticleLayout');
        
        formatInfo.isOldFormat = isOldFormat;

        if (isOldFormat) {
          console.log('Detectado formato antigo de MDX (com ArticleLayout)');
          
          // Para o formato antigo, extraímos apenas o conteúdo real (após o último export)
          const contentMatch = content.match(/export default \([^)]*\) => <ArticleLayout[^>]*>([^<]*)<\/ArticleLayout>/);
          if (contentMatch && contentMatch[1]) {
            // Extrair o conteúdo real
            processedContent = contentMatch[1].trim();
            formatInfo.extractionMethod = 'regex-match';
            console.log('Conteúdo extraído usando regex-match');
          } else {
            // Se não conseguir extrair, usar tudo após o último export
            const parts = content.split('export default');
            if (parts.length > 1) {
              // Remover a última parte (que contém ArticleLayout) e pegar o resto
              processedContent = parts.slice(0, -1).join('export default');
              formatInfo.extractionMethod = 'split';
              console.log('Conteúdo extraído usando split');
            } else {
              console.warn('Não foi possível extrair conteúdo do formato antigo');
            }
          }
        } else {
          console.log('Detectado formato novo de MDX (com frontmatter)');
          
          // Remover frontmatter YAML se presente
          // O frontmatter está entre --- no início do documento
          formatInfo.hasFrontmatter = processedContent.startsWith('---');
          
          if (formatInfo.hasFrontmatter) {
            // Encontrar o segundo marcador --- que fecha o frontmatter
            const secondMarkerIndex = processedContent.indexOf('---', 3);
            if (secondMarkerIndex !== -1) {
              // Capturar o frontmatter para debug
              const frontmatter = processedContent.substring(3, secondMarkerIndex).trim();
              console.log('Frontmatter encontrado:', frontmatter);
              
              // Extrair apenas o conteúdo após o frontmatter
              processedContent = processedContent.substring(secondMarkerIndex + 3).trim();
              formatInfo.frontmatterRemoved = true;
              console.log('Frontmatter YAML removido do conteúdo');
              debugContent('Conteúdo após remoção do frontmatter', processedContent);
              
              // Verificar se ainda há texto de frontmatter visível no conteúdo
              const lines = processedContent.split('\n');
              const possibleFrontmatterLines = lines.slice(0, 10).join('\n');
              
              // Verificar se há padrões comuns de frontmatter no início do conteúdo
              if (possibleFrontmatterLines.includes('title:') && 
                  (possibleFrontmatterLines.includes('description:') || 
                   possibleFrontmatterLines.includes('author:') || 
                   possibleFrontmatterLines.includes('date:'))) {
                console.warn('Possível frontmatter ainda presente no conteúdo. Tentando remover manualmente.');
                
                // Tentativa adicional de remover frontmatter renderizado como texto
                const cleanedLines = lines.filter(line => {
                  // Filtrar linhas que parecem ser frontmatter
                  return !(
                    line.trim().startsWith('title:') || 
                    line.trim().startsWith('description:') || 
                    line.trim().startsWith('author:') || 
                    line.trim().startsWith('date:')
                  );
                });
                
                // Remover possíveis linhas vazias no início
                while (cleanedLines.length > 0 && cleanedLines[0].trim() === '') {
                  cleanedLines.shift();
                }
                
                processedContent = cleanedLines.join('\n');
                console.log('Conteúdo após limpeza adicional de frontmatter');
                debugContent('Conteúdo limpo', processedContent);
              }
            }
          }
        }
        
        // Etapa 2: Normalizar o conteúdo MDX
        console.log('Normalizando conteúdo MDX...');
        const normalizedContent = normalizeMDXContent(processedContent);
        debugContent('Conteúdo normalizado', normalizedContent);
        
        // Etapa 3: Processar referências de imagens
        console.log(`Processando referências de imagens (${Object.keys(images).length} imagens)...`);
        const contentWithImages = images && Object.keys(images).length > 0
          ? processImageReferences(normalizedContent, images)
          : normalizedContent;
        debugContent('Conteúdo com referências de imagens processadas', contentWithImages);
        
        // Etapa 4: Serializar o conteúdo processado para MDX
        console.log('Serializando conteúdo MDX...');
        
        // Configuração personalizada do sanitizador para permitir links e seus atributos
        const sanitizeSchema = {
          ...defaultSchema,
          attributes: {
            ...defaultSchema.attributes,
            a: [
              ...(defaultSchema.attributes?.a || []),
              // Permitir atributos para links externos
              'target', 'rel'
            ]
          }
        };
        
        const mdxSource = await serialize(contentWithImages, {
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              // rehypeRaw foi removido para evitar conflitos
              [rehypeSanitize, sanitizeSchema], 
              [rehypePrism, { ignoreMissing: true }]
            ],
            development: process.env.NODE_ENV === 'development',
          },
          parseFrontmatter: false, // Desabilitar parsing de frontmatter para evitar que seja renderizado
        });
        
        setMdxSource(mdxSource);
        console.log('MDX processado com sucesso');
        
        // Guardar informações de debug
        setDebugInfo({
          formatInfo,
          contentLength: {
            original: content.length,
            processed: processedContent.length,
            normalized: normalizedContent.length,
            final: contentWithImages.length
          },
          hasImages: Object.keys(images).length > 0,
        });
      } catch (err: any) {
        console.error('Erro ao processar MDX:', err);
        setError(`Falha ao renderizar o conteúdo do artigo: ${err.message || 'Erro desconhecido'}`);
        
        // Informações adicionais para depuração em caso de erro
        if (typeof content === 'string') {
          console.error(`Trecho do conteúdo problemático: ${content.substring(0, 100)}...`);
        } else {
          console.error(`O conteúdo não é uma string: ${typeof content}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    processMDX();
  }, [content, images]);

  // Componentes customizados para o MDX - certifique-se de que todos são válidos
  const components = {
    // Componentes básicos
    img: (props: any) => <Image {...props} />,
    Image: (props: any) => <Image {...props} />,
    
    // Componentes para blocos de código
    code: (props: any) => <CodeWrapper {...props} />,
    pre: (props: any) => <PreWrapper {...props} />,
    
    // Links personalizados
    a: (props: any) => <CustomLink {...props} />,
  };

  if (isLoading) {
    return (
      <div className="my-8 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">Carregando conteúdo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-8">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
            O conteúdo não pôde ser renderizado corretamente. Tente recarregar a página ou contate o administrador.
          </p>
        </div>
        
        {/* Informação de debug - visível apenas em desenvolvimento */}
        {process.env.NODE_ENV !== 'production' && debugInfo && (
          <details className="mt-4 p-3 border border-zinc-200 dark:border-zinc-700 rounded-md">
            <summary className="text-sm text-zinc-500 dark:text-zinc-400 cursor-pointer">
              Informações de debug
            </summary>
            <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  }

  return (
    <Prose className="mt-8">
      {mdxSource ? (
        <>
          <MDXRemote {...mdxSource} components={components} />
          
          {/* Informação de debug - visível apenas em desenvolvimento */}
          {process.env.NODE_ENV !== 'production' && debugInfo && (
            <details className="mt-8 p-3 border border-zinc-200 dark:border-zinc-700 rounded-md">
              <summary className="text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer">
                Debug do MDX
              </summary>
              <div className="mt-2 text-xs">
                <p>Formato: {debugInfo.formatInfo.isOldFormat ? 'Antigo' : 'Novo'}</p>
                {debugInfo.formatInfo.isOldFormat && (
                  <p>Método de extração: {debugInfo.formatInfo.extractionMethod}</p>
                )}
                <p>Tamanho original: {debugInfo.contentLength.original} caracteres</p>
                <p>Tamanho processado: {debugInfo.contentLength.final} caracteres</p>
                <p>Imagens: {debugInfo.hasImages ? 'Sim' : 'Não'}</p>
                <p>Tem frontmatter: {debugInfo.formatInfo.hasFrontmatter ? 'Sim' : 'Não'}</p>
              </div>
            </details>
          )}
        </>
      ) : (
        <p className="text-zinc-500 dark:text-zinc-400">
          Nenhum conteúdo disponível para exibição.
        </p>
      )}
    </Prose>
  );
} 