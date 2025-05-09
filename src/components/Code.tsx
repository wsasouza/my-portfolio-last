'use client';

import { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import { detectLanguage, highlightCodeWithShiki } from '@/utils/shiki-utils';

interface CodeProps {
  children: React.ReactNode;
  className?: string;
  language?: string;
  filename?: string;
  highlight?: string;  
  tokens?: any[];
  tokenized?: boolean;
  value?: string;
}

function extractTextFromReactChildren(children: any): string {  
  if (typeof children === 'string') {
    return children;
  }  
  
  if (Array.isArray(children)) {
    return children.map(extractTextFromReactChildren).join('');
  }  
 
  if (children && typeof children === 'object' && 'value' in children && typeof children.value === 'string') {
    return children.value;
  }  
  
  if (children && typeof children === 'object' && 'tokens' in children && Array.isArray(children.tokens)) {
    return children.tokens.map((token: any) => {
      if (typeof token === 'string') return token;
      if (token && typeof token === 'object' && 'content' in token) return token.content;
      if (token && typeof token === 'object' && 'children' in token) {
        return token.children.map((child: any) => {
          if (typeof child === 'string') return child;
          if (child && typeof child === 'object' && 'content' in child) return child.content;
          return '';
        }).join('');
      }
      return '';
    }).join('');
  }  
  
  if (children && typeof children === 'object' && 'props' in children && children.props) {
    if ('children' in children.props) {
      return extractTextFromReactChildren(children.props.children);
    }
  }  
 
  if (children && typeof children === 'object' && 'type' in children) {    
    if (children.type === 'code' && 'props' in children && children.props && 'children' in children.props) {
      return extractTextFromReactChildren(children.props.children);
    }
  }  
  
  if (children && typeof children === 'object' && typeof children.toString === 'function') {
    const str = children.toString();
    if (str && str !== '[object Object]') {
      return str;
    }
  }  
 
  return '';
}

export function Code(props: CodeProps) {
  const { children, className, language, filename, highlight, value, tokens } = props;
  const textRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [isHighlighting, setIsHighlighting] = useState(true);  
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('Code props:', {
      className,
      language,
      filename,
      highlight,
      hasValue: !!value,
      hasTokens: !!tokens,
      childrenType: typeof children
    });
  }
  
  const lang = detectLanguage(className, language) || 'text';  
 
  const highlightLines = new Set<number>();
  
  if (highlight) {
    highlight.replace(/[{}]/g, '').split(',').forEach(range => {
      if (range.includes('-')) {        
        const [start, end] = range.split('-').map(num => parseInt(num.trim(), 10));
        for (let i = start; i <= end; i++) {
          highlightLines.add(i);
        }
      } else {       
        highlightLines.add(parseInt(range.trim(), 10));
      }
    });
  }
  
  const copyToClipboard = async () => {
    if (textRef.current && textRef.current.textContent) {
      try {
        await navigator.clipboard.writeText(textRef.current.textContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Falha ao copiar:', err);
      }
    }
  };

  // Prioridade de fontes para o conteúdo:
  // 1. A propriedade 'value' diretamente (adicionada pelo MDX)
  // 2. Extrair do children
  // 3. Processar tokens
  let codeContent = '';
  
  if (typeof value === 'string') {    
    codeContent = value;
  } else if (tokens && Array.isArray(tokens)) {    
    codeContent = tokens.map(token => {
      if (typeof token === 'string') return token;
      if (token && typeof token === 'object' && 'content' in token) return token.content;
      return '';
    }).join('');
  } else {    
    codeContent = extractTextFromReactChildren(children);
  }
  
  useEffect(() => {
    let isMounted = true;
    
    async function highlight() {
      if (codeContent) {
        setIsHighlighting(true);
        try {         
          const normalizedLang = lang || 'text';          
          
          const highlighted = await highlightCodeWithShiki(codeContent, normalizedLang);
          if (isMounted) {
            setHighlightedCode(highlighted);
          }
        } catch (error) {
          console.error('Erro ao destacar código:', error);
        } finally {
          if (isMounted) {
            setIsHighlighting(false);
          }
        }
      } else {
        if (isMounted) {
          setHighlightedCode('');
          setIsHighlighting(false);
        }
      }
    }
    
    highlight();
    
    return () => {
      isMounted = false;
    };
  }, [codeContent, lang]);
  
  const codeLines = codeContent.split('\n');
  const hasHighlight = highlightLines.size > 0 && codeLines.length > 0;  

  return (
    <div className="group relative my-6 overflow-hidden rounded-lg bg-zinc-950 dark:bg-zinc-800/60">
      {/* Barra superior com linguagem e botão de cópia */}
      <div className="flex items-center justify-between border-b border-zinc-700/50 bg-zinc-800 px-4 py-2 text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="text-zinc-400">{filename}</span>
          )}
          {lang && (
            <span className="rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-200">
              {lang}
            </span>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className="rounded bg-zinc-700 px-2 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-600 transition-colors cursor-pointer"
        >
          {isCopied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      
      {/* Conteúdo do código */}
      {isHighlighting ? (
        <div className="p-4 text-sm font-mono text-zinc-300 animate-pulse">
          Carregando...
        </div>
      ) : hasHighlight ? (
        <div className="overflow-x-auto p-4 code-block">
          {codeLines.map((line, i) => (
            <div 
              key={i} 
              className={clsx(
                'font-mono text-sm leading-6',
                highlightLines.has(i+1) && 'bg-zinc-700/30 -mx-4 px-4'
              )}
            >
              {line || ' '}
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={textRef}
          className="overflow-x-auto p-4 text-sm font-mono code-block"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      )}
    </div>
  );
} 
