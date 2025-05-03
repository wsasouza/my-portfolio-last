'use client';

import { Code } from './Code';
import { parseCodeBlockMetastring } from '@/utils/mdx-utils';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  metastring?: string;
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

// Função auxiliar para extrair texto de objetos React complexos
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
  
  // Para outros casos, retornamos string vazia ou indicamos um objeto
  console.warn('Não foi possível extrair texto de:', safeLogObject(children));
  return '';
}

export function CodeBlock(props: CodeBlockProps) {
  const { children, className, metastring = '', value, tokens } = props;
  
  // Log para debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('CodeBlock props:', {
      className,
      metastring,
      hasValue: !!value,
      hasTokens: !!tokens,
      childrenType: typeof children
    });
    
    // Se children for um objeto, logar uma versão segura das suas propriedades
    if (children && typeof children === 'object') {
      console.log('CodeBlock children (seguro):', safeLogObject(children));
    }
  }
  
  // Parsear metastring para extrair filename e outras propriedades
  const metadata = parseCodeBlockMetastring(metastring);
  
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
  
  // Garantir que temos uma string e aplicar trim
  const code = (codeContent || '').trim();
  
  // Determinar linguagem do código
  const language = className ? className.replace(/language-/, '') : '';
  
  // Extrair parâmetros highlight
  const highlight = metadata.highlight;
  
  return (
    <Code 
      className={className}
      language={language}
      filename={metadata.filename}
      highlight={highlight}
    >
      {code}
    </Code>
  );
} 