/**
 * Função para normalizar o conteúdo MDX, especialmente para blocos de código
 * @param content Conteúdo MDX
 * @returns Conteúdo MDX normalizado
 */
export function normalizeMDXContent(content: string): string {
  if (typeof content !== 'string') {
    console.warn('Conteúdo MDX não é uma string. Convertendo para string vazia.');
    return '';
  }
  
  let normalizedContent = content;
  
  try {
    // Ajustar blocos de código para garantir que tenham a sintaxe correta
    // Exemplo: convertendo ```js para ```jsx ou ```ts para ```tsx quando tem JSX dentro
    normalizedContent = normalizedContent.replace(
      /```(js|ts)(\s+.*?)?\n([\s\S]*?)(return\s+<[\s\S]*?>[\s\S]*?)\n```/g,
      (match, lang, meta, code, jsx) => {
        const newLang = lang === 'js' ? 'jsx' : 'tsx';
        return `\`\`\`${newLang}${meta || ''}\n${code}${jsx}\n\`\`\``;
      }
    );
    
    // Processar blocos de código com nomes de arquivo
    // Converter ```ts:example.ts para ```ts filename="example.ts"
    normalizedContent = normalizedContent.replace(
      /```(\w+):([^\s]+)(\s+.*?)?\n/g,
      (match, lang, filename, meta) => {
        return `\`\`\`${lang} filename="${filename}"${meta || ''}\n`;
      }
    );
    
    // Corrigir blocos de código com números de linha
    // Exemplo: ```js{1,3-5} para ```js highlight={1,3-5}
    normalizedContent = normalizedContent.replace(
      /```(\w+)({[\d,-]+})(\s+.*?)?\n/g,
      (match, lang, lineNumbers, meta) => {
        return `\`\`\`${lang} highlight=${lineNumbers}${meta || ''}\n`;
      }
    );
    
    // Substituir o uso de <Image> com src={importName} por <Image src="URL"
    // Isso é útil para quando as importações de imagens já foram processadas
    normalizedContent = normalizedContent.replace(
      /<Image\s+src={([^}]+)}([^>]*)>/g,
      (match, importName, rest) => {
        // Não alterar se src já é uma string com aspas
        if (importName.startsWith('"') || importName.startsWith("'")) {
          return match;
        }
        // Usar um placeholder temporário que será substituído posteriormente
        return `<Image src="__IMAGE_${importName}__"${rest}>`;
      }
    );
    
    // Normalizar links HTML para garantir formatação correta
    // Adicionar target="_blank" e rel="noopener noreferrer" para links externos que não os tenham
    normalizedContent = normalizedContent.replace(
      /<a\s+href="(https?:\/\/[^"]+)"([^>]*)>/g,
      (match, url, attrs) => {
        // Verificar se já tem target e rel
        if (!attrs.includes('target="_blank"')) {
          attrs = attrs ? `${attrs} target="_blank"` : ` target="_blank"`;
        }
        if (!attrs.includes('rel="')) {
          attrs = attrs ? `${attrs} rel="noopener noreferrer"` : ` rel="noopener noreferrer"`;
        }
        return `<a href="${url}"${attrs}>`;
      }
    );
    
  } catch (error) {
    console.error('Erro ao normalizar conteúdo MDX:', error);
    // Em caso de erro, retornar o conteúdo original em vez de quebrar completamente
  }
  
  return normalizedContent;
}

/**
 * Função para processamento adicional do conteúdo MDX com referências de imagens
 * @param content Conteúdo MDX normalizado
 * @param images Dicionário de imagens {filename: url}
 * @returns Conteúdo MDX com referências de imagens ajustadas
 */
export function processImageReferences(content: string, images: Record<string, string>): string {
  let processedContent = content;
  
  // Para cada imagem no dicionário
  Object.entries(images).forEach(([filename, url]) => {
    const baseFilename = filename.split('.')[0];
    
    // Substituir os placeholders __IMAGE_XXX__ por URLs reais
    processedContent = processedContent.replace(
      new RegExp(`__IMAGE_${baseFilename}__`, 'g'),
      url
    );
    
    // Substituir as linhas de importação por comentários
    processedContent = processedContent.replace(
      new RegExp(`import ${baseFilename} from .*\\n`, 'g'),
      `{/* Image: ${filename} imported from ${url} */}\n`
    );
  });
  
  return processedContent;
}

/**
 * Função para extrair metadados de um bloco de código MDX
 * @param metastring String de metadados (ex: 'filename="example.js" highlight={1,3-5}')
 * @returns Objeto com os metadados
 */
export function parseCodeBlockMetastring(metastring: string = ''): Record<string, string> {
  const metadata: Record<string, string> = {};
  
  if (!metastring) return metadata;
  
  // Extrair parâmetros da metastring
  // Regex que considera aspas e formatação especial
  const regex = /(\w+)(?:=(?:(?:"([^"]*)")|(?:'([^']*)')|({[^}]*})|(\S+)))?/g;
  let match;
  
  while ((match = regex.exec(metastring)) !== null) {
    const [_, key, doubleQuoted, singleQuoted, braced, simple] = match;
    const value = doubleQuoted || singleQuoted || braced || simple || 'true';
    metadata[key] = value;
  }
  
  return metadata;
} 