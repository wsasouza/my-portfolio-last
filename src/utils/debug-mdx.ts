/**
 * Utilitário para debugar conteúdo MDX e possíveis problemas de renderização
 */

export interface ImportInfo {
  varName: string;
  path: string;
}

export interface ImageInfo {
  src: string | undefined;
  hasImport?: boolean;
}

export interface FrontmatterInfo {
  exists: boolean;
  title?: string;
  description?: string;
  author?: string;
  date?: string;
  raw?: string;
}

export interface DebugInfo {
  length: number;
  excerpt: string;
  imports: ImportInfo[];
  components: string[];
  codeBlocks: number;
  images: ImageInfo[];
  format?: 'old' | 'new';
  frontmatter?: FrontmatterInfo;
}

export function debugMDXContent(content: string): {
  info: DebugInfo;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Verificar se o conteúdo é uma string válida
  if (typeof content !== 'string') {
    warnings.push('O conteúdo não é uma string válida');
    return { 
      info: { 
        type: typeof content,
        length: 0,
        excerpt: '',
        imports: [],
        components: [],
        codeBlocks: 0,
        images: []
      } as unknown as DebugInfo,
      warnings 
    };
  }
  
  // Determinar o formato do MDX
  const isOldFormat = content.includes('import { ArticleLayout }') || 
                     content.includes('export default (props) => <ArticleLayout');
  
  // Informações básicas
  const info: DebugInfo = {
    length: content.length,
    excerpt: content.length > 0 ? `${content.substring(0, 100)}...` : '(vazio)',
    format: isOldFormat ? 'old' : 'new',
    imports: [],
    components: [],
    codeBlocks: 0,
    images: []
  };
  
  // Extrair informações do frontmatter se existir
  if (content.startsWith('---')) {
    const secondMarkerIndex = content.indexOf('---', 3);
    if (secondMarkerIndex !== -1) {
      const frontmatterRaw = content.substring(3, secondMarkerIndex).trim();
      
      info.frontmatter = {
        exists: true,
        raw: frontmatterRaw
      };
      
      // Extrair propriedades básicas do frontmatter
      const titleMatch = frontmatterRaw.match(/title:\s*(?:"([^"]*)"|'([^']*)'|([^\n]*))/);
      if (titleMatch) {
        info.frontmatter.title = (titleMatch[1] || titleMatch[2] || titleMatch[3]).trim();
      }
      
      const descriptionMatch = frontmatterRaw.match(/description:\s*(?:"([^"]*)"|'([^']*)'|([^\n]*))/);
      if (descriptionMatch) {
        info.frontmatter.description = (descriptionMatch[1] || descriptionMatch[2] || descriptionMatch[3]).trim();
      }
      
      const authorMatch = frontmatterRaw.match(/author:\s*(?:"([^"]*)"|'([^']*)'|([^\n]*))/);
      if (authorMatch) {
        info.frontmatter.author = (authorMatch[1] || authorMatch[2] || authorMatch[3]).trim();
      }
      
      const dateMatch = frontmatterRaw.match(/date:\s*(?:"([^"]*)"|'([^']*)'|([^\n]*))/);
      if (dateMatch) {
        info.frontmatter.date = (dateMatch[1] || dateMatch[2] || dateMatch[3]).trim();
      }
    } else {
      warnings.push('Frontmatter iniciado com --- mas não possui marcador de fechamento');
      info.frontmatter = { exists: true, raw: 'incompleto' };
    }
  } else {
    info.frontmatter = { exists: false };
  }
  
  // Verificar imports
  const importMatches = content.match(/import\s+(\w+)\s+from\s+["']([^"']+)["']/g) || [];
  info.imports = importMatches.map(match => {
    const importMatch = /import\s+(\w+)\s+from\s+["']([^"']+)["']/.exec(match);
    if (importMatch) {
      return { 
        varName: importMatch[1], 
        path: importMatch[2] 
      };
    }
    return { varName: '', path: '' };
  }).filter(item => item.varName !== '');
  
  // Verificar referências de componentes
  const componentMatches = content.match(/<[A-Z]\w+[^>]*>/g) || [];
  info.components = [...new Set(componentMatches.map(match => {
    const componentNameMatch = match.match(/<([A-Z]\w+)/);
    return componentNameMatch ? componentNameMatch[1] : '';
  }).filter(Boolean))];
  
  // Verificar blocos de código
  const codeBlockMatches = content.match(/```[\s\S]*?```/g) || [];
  info.codeBlocks = codeBlockMatches.length;
  
  // Verificar imagens
  const imageMatches = content.match(/<Image[^>]*>/g) || [];
  info.images = imageMatches.map(match => {
    const srcMatch = match.match(/src=["']([^"']+)["']/) || match.match(/src=\{([^}]+)\}/);
    const src = srcMatch ? srcMatch[1] : undefined;
    
    const hasImport = src && info.imports.some(i => i.varName === src);
    
    return { 
      src,
      hasImport: typeof hasImport === 'boolean' ? hasImport : undefined
    };
  });
  
  // Validar importações de imagens referenciadas
  info.images.forEach(image => {
    if (image.src && /^\w+$/.test(image.src) && 
        !info.imports.some(i => i.varName === image.src)) {
      warnings.push(`Imagem ${image.src} é referenciada, mas não foi importada`);
    }
  });
  
  // Verificar JSX
  if (content.includes('<') && content.includes('>')) {
    const jsxBalance = content.split('<').length - content.split('>').length;
    if (jsxBalance !== 0) {
      warnings.push(`Possível desbalanceamento de tags JSX: diferença de ${jsxBalance}`);
    }
  }
  
  // Verificar se frontmatter está presente no formato esperado
  if (info.format === 'new' && !content.startsWith('---')) {
    warnings.push('Conteúdo MDX no novo formato deve começar com frontmatter (---)');
  }
  
  return { info, warnings };
} 