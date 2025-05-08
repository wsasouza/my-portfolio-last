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
    const codeBlocks = normalizedContent.match(/```(\w+)([^\n]*)\n([\s\S]*?)```/g);
    
    if (codeBlocks) {
      console.log(`Encontrados ${codeBlocks.length} blocos de código no MDX`);
      
      codeBlocks.forEach((block, index) => {        
        const langMatch = block.match(/```(\w+)([^\n]*)/);
        if (langMatch && langMatch[1]) {
          const language = langMatch[1];
          const metastring = langMatch[2]?.trim() || '';          
          
          const processedBlock = block.replace(
            /```(\w+)([^\n]*)\n/,
            (_, lang, meta) => {              
              if (!meta.includes(`language="${lang}"`) && !meta.includes(`language=${lang}`)) {
                return `\`\`\`${lang} language="${lang}"${meta}\n`;
              }
              return `\`\`\`${lang}${meta}\n`;
            }
          );
          
          normalizedContent = normalizedContent.replace(block, processedBlock);
          
          console.log(`Bloco de código ${index + 1}: Linguagem: ${language}, Metadados: ${metastring}`);
        }
      });
    }    
    
    normalizedContent = normalizedContent.replace(
      /```(\w+):([^\s]+)(\s+.*?)?\n/g,
      (match, lang, filename, meta) => {
        return `\`\`\`${lang} filename="${filename}"${meta || ''}\n`;
      }
    );    
    
    normalizedContent = normalizedContent.replace(
      /```(\w+)({[\d,-]+})(\s+.*?)?\n/g,
      (match, lang, lineNumbers, meta) => {
        return `\`\`\`${lang} highlight=${lineNumbers}${meta || ''}\n`;
      }
    );    
    
    normalizedContent = normalizedContent.replace(
      /```(\w+)\s+(?:title|file)="([^"]+)"(\s+.*?)?\n/g,
      (match, lang, filename, meta) => {
        return `\`\`\`${lang} filename="${filename}"${meta || ''}\n`;
      }
    );    
    
    normalizedContent = normalizedContent.replace(
      /```(\w+)\s+(\S+\.\w+)(\s+.*?)?\n/g,
      (match, lang, filename, meta) => {        
        if (filename.includes('.') && !filename.startsWith('language-') && !meta?.includes('filename=')) {
          return `\`\`\`${lang} filename="${filename}"${meta || ''}\n`;
        }
        return match;
      }
    );    
   
    normalizedContent = normalizedContent.replace(
      /<Image\s+src={([^}]+)}([^>]*)>/g,
      (match, importName, rest) => {        
        if (importName.startsWith('"') || importName.startsWith("'")) {
          return match;
        }
        
        return `<Image src="__IMAGE_${importName}__"${rest}>`;
      }
    );    
    
    normalizedContent = normalizedContent.replace(
      /<a\s+href="(https?:\/\/[^"]+)"([^>]*)>/g,
      (match, url, attrs) => {       
        if (!attrs.includes('target="_blank"')) {
          attrs = attrs ? `${attrs} target="_blank"` : ` target="_blank"`;
        }
        if (!attrs.includes('rel="')) {
          attrs = attrs ? `${attrs} rel="noopener noreferrer"` : ` rel="noopener noreferrer"`;
        }
        return `<a href="${url}"${attrs}>`;
      }
    );
    
  } catch (err) {
    console.error('Erro ao normalizar conteúdo MDX:', err);
    return content;
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
  
  try {    
    Object.entries(images).forEach(([filename, url]) => {
      const baseFilename = filename.split('.')[0];      
      
      processedContent = processedContent.replace(
        new RegExp(`__IMAGE_${baseFilename}__`, 'g'),
        url
      );      
      
      const varRegex = new RegExp(`<Image\\s+src=\\{${baseFilename}(Img)?\\}([^>]*)>`, 'g');
      processedContent = processedContent.replace(
        varRegex,
        `![${filename}](${url})`
      );      
      
      processedContent = processedContent.replace(
        new RegExp(`import ${baseFilename}(Img)? from .*\\n`, 'g'),
        `{/* Image: ${filename} imported from ${url} */}\n`
      );      
      
      processedContent = processedContent.replace(
        new RegExp(`(export )?const ${baseFilename}(Img)? = ["']${url}["'];?\\n?`, 'g'),
        ''
      );
    });
  } catch (error) {
    console.error('Erro ao processar referências de imagens:', error);    
  }
  
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
  
  try {   
    if (metastring.startsWith('{') && metastring.endsWith('}')) {
      try {
        const jsonData = JSON.parse(metastring);
        Object.entries(jsonData).forEach(([key, value]) => {
          metadata[key] = String(value);
        });
        return metadata;
      } catch (e) {        
        console.warn('Falha ao analisar metastring como JSON:', metastring);
      }
    }
    
    const attributeRegex = /([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s"]*))/g;
    let match;
    
    while ((match = attributeRegex.exec(metastring)) !== null) {
      const [_, key, doubleQuoted, singleQuoted, unquoted] = match;
      const value = doubleQuoted || singleQuoted || unquoted;
      metadata[key] = value;
    }    
    
    const fileExtRegex = /^[\w\-\.\/]+\.[a-zA-Z0-9]+$/;
    if (metastring.match(fileExtRegex)) {
      metadata.filename = metastring.trim();
    }    
    
    const langColonFileRegex = /^([a-zA-Z0-9_\-+#]+):([^\s]+)$/;
    const langFileMatch = metastring.match(langColonFileRegex);
    if (langFileMatch) {
      metadata.language = langFileMatch[1];
      metadata.filename = langFileMatch[2];
    }    
    
    const highlightRegex = /(?:highlight=)?{([^}]+)}/;
    const highlightMatch = metastring.match(highlightRegex);
    if (highlightMatch) {
      metadata.highlight = highlightMatch[1];
    }    
    
    const tokens = metastring.split(/\s+/);
    if (tokens.length > 0) {      
      if (tokens[0] && !tokens[0].includes('=') && !tokens[0].includes('"') && !tokens[0].match(fileExtRegex)) {
        if (!metadata.language) {
          metadata.language = tokens[0];
        }
      }      
      
      if (tokens.length > 1 && tokens[1] && tokens[1].includes('.') && !tokens[1].includes('=')) {
        if (!metadata.filename) {
          metadata.filename = tokens[1];
        }
      }
    }
    
    console.log('Metadados extraídos:', metadata, 'de metastring:', metastring);
    return metadata;
  } catch (error) {
    console.error('Erro ao processar metastring:', error);
    return metadata;
  }
} 
