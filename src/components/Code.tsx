'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';

interface CodeProps {
  children: React.ReactNode;
  className?: string;
  language?: string;
  filename?: string;
  highlight?: string;
  // Propriedades específicas do MDXRemote quando passa conteúdo tokenizado
  tokens?: any[];
  tokenized?: boolean;
  value?: string;
}

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

// Função auxiliar para extrair texto de objetos React complexos (mesma do CodeBlock)
function extractTextFromReactChildren(children: any): string {
  // Se for uma string, retornamos diretamente
  if (typeof children === 'string') {
    return children;
  }
  
  // Se for um array, processamos cada item e juntamos
  if (Array.isArray(children)) {
    return children.map(extractTextFromReactChildren).join('');
  }
  
  // Se o objeto MDXRemote incluir uma propriedade 'value' diretamente
  if (children && typeof children === 'object' && 'value' in children && typeof children.value === 'string') {
    return children.value;
  }
  
  // Se tiver tokens
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
  
  // Se o objeto tiver uma propriedade props.children
  if (children && typeof children === 'object' && 'props' in children && children.props) {
    if ('children' in children.props) {
      return extractTextFromReactChildren(children.props.children);
    }
  }
  
  // Se o objeto tiver uma propriedade type (para componentes React)
  if (children && typeof children === 'object' && 'type' in children) {
    // Para elementos específicos como <code>
    if (children.type === 'code' && 'props' in children && children.props && 'children' in children.props) {
      return extractTextFromReactChildren(children.props.children);
    }
  }
  
  // Para classes com toString()
  if (children && typeof children === 'object' && typeof children.toString === 'function') {
    const str = children.toString();
    if (str && str !== '[object Object]') {
      return str;
    }
  }
  
  // Para outros casos, retornamos string vazia
  return '';
}

export function Code(props: CodeProps) {
  const { children, className, language, filename, highlight, value, tokens } = props;
  const textRef = useRef<HTMLPreElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Log para debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('Code props:', {
      className,
      language,
      filename,
      hasValue: !!value,
      hasTokens: !!tokens,
      childrenType: typeof children
    });
    
    // Se children for um objeto, logar uma versão segura das suas propriedades
    if (children && typeof children === 'object') {
      console.log('Code children (seguro):', safeLogObject(children));
    }
  }

  // Extrair a linguagem do className (ex: language-javascript)
  const match = /language-(\w+)/.exec(className || '');
  const lang = language || (match ? match[1] : '');
  
  // Processar highlight para formar um conjunto de linhas a destacar
  const highlightLines = new Set<number>();
  
  if (highlight) {
    highlight.replace(/[{}]/g, '').split(',').forEach(range => {
      if (range.includes('-')) {
        // Processar intervalo (ex: 3-5)
        const [start, end] = range.split('-').map(num => parseInt(num.trim(), 10));
        for (let i = start; i <= end; i++) {
          highlightLines.add(i);
        }
      } else {
        // Processar número único
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
    // Se temos a propriedade value diretamente, usamos ela
    codeContent = value;
  } else if (tokens && Array.isArray(tokens)) {
    // Se temos tokens, extraímos o conteúdo deles
    codeContent = tokens.map(token => {
      if (typeof token === 'string') return token;
      if (token && typeof token === 'object' && 'content' in token) return token.content;
      return '';
    }).join('');
  } else {
    // Caso contrário, extraímos do children
    codeContent = extractTextFromReactChildren(children);
  }

  // Se tivermos linhas para destacar, dividimos o código em linhas
  const codeLines = codeContent.split('\n');
  const hasHighlight = highlightLines.size > 0 && codeLines.length > 0;

  // Debug se tivermos problemas com o conteúdo
  if (process.env.NODE_ENV !== 'production' && !codeContent && children) {
    console.warn('Code: Conteúdo vazio extraído de:', safeLogObject(children));
  }

  return (
    <div className="group relative my-6 overflow-hidden rounded-lg bg-zinc-900 dark:bg-zinc-800/60">
      {/* Barra superior com linguagem e botão de cópia */}
      <div className="flex items-center justify-between border-b border-zinc-700/50 bg-zinc-800 px-4 py-2 text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="text-zinc-400">{filename}</span>
          )}
          {lang && (
            <span className="rounded bg-zinc-700 px-2 py-1 text-xs font-medium text-zinc-200">
              {lang}
            </span>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className="rounded bg-zinc-700 px-2 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-600 transition-colors"
        >
          {isCopied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      
      {/* Conteúdo do código */}
      {hasHighlight ? (
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
        <pre
          ref={textRef}
          className={clsx(
            'overflow-x-auto p-4 text-sm font-mono code-block',
            className
          )}
        >
          <code className={className}>{codeContent}</code>
        </pre>
      )}
    </div>
  );
} 