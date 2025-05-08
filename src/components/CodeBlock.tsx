'use client';

import { Code } from './Code';
import { parseCodeBlockMetastring } from '@/utils/mdx-utils';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  metastring?: string;
  language?: string;
  filename?: string;
  'data-filename'?: string;
  'data-highlight'?: string;  
  tokens?: any[];
  tokenized?: boolean;
  value?: string;
  [key: string]: any; 
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

export function CodeBlock(props: CodeBlockProps) {
  const { children, className, metastring = '', language: propLanguage, value, tokens } = props;  
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('CodeBlock props:', {
      className,
      metastring,
      propLanguage,
      hasValue: !!value,
      hasTokens: !!tokens,
      childrenType: typeof children
    });
  }
  
  let extractedFilename = props['data-filename'] || '';
  let extractedHighlight = props['data-highlight'] || '';  
  
  const metadata = parseCodeBlockMetastring(metastring);
  
  // Determinar linguagem do código (ordem de prioridade)
  // 1. Prop language passada diretamente
  // 2. Metadata language extraída do metastring
  // 3. Da className (language-xxx)
  // 4. Do primeiro token (usualmente o nome do arquivo/fences)
  // 5. Fallback para texto
  let language = propLanguage || metadata.language || '';
  
  if (!language && className) {
    const langMatch = /language-(\w+)/.exec(className);
    if (langMatch && langMatch[1]) {
      language = langMatch[1];
    }
  }
 
  if (!language) {
    const codeContent = extractTextFromReactChildren(children);   
    const firstLine = codeContent.split('\n')[0];
    if (firstLine && firstLine.startsWith('```')) {
      const langFromFence = firstLine.slice(3).trim();
      if (langFromFence && !langFromFence.includes(' ')) {
        language = langFromFence;
        console.log('Linguagem detectada do fence:', language);
      }
    }
  }  
 
  if (!language) {    
    const directCodeMatch = metastring.match(/^```(\w+)/);
    if (directCodeMatch && directCodeMatch[1]) {
      language = directCodeMatch[1];
      console.log('Linguagem detectada do metastring fence:', language);
    }
  }  
 
  const filename = metadata.filename || extractedFilename || props.filename || '';  
  
  const highlight = metadata.highlight || extractedHighlight || '';  
  
  let codeContent = '';
  if (typeof value === 'string') {
    codeContent = value;
  } else {
    codeContent = extractTextFromReactChildren(children);
  }

  console.log('CodeBlock final props:', { language, filename, highlight });
  
  return (
    <Code 
      className={language ? `language-${language}` : className}
      language={language}
      filename={filename}
      highlight={highlight}
      value={codeContent}
      tokens={tokens}
    >
      {children}
    </Code>
  );
} 
