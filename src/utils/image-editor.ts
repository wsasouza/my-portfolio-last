/**
 * Função para inserir referência de imagem no editor de conteúdo MDX
 * 
 * @param content - Conteúdo atual do editor
 * @param filename - Nome do arquivo da imagem
 * @param imageUrl - URL da imagem
 * @param textArea - Referência ao elemento textarea
 * @returns Conteúdo atualizado com a referência da imagem
 */
export function insertImageInEditor(
  content: string, 
  filename: string, 
  imageUrl: string, 
  textArea: HTMLTextAreaElement | null
): string {
  if (!textArea || !filename || !imageUrl) {
    return content;
  }
  
  // Criar nome de variável a partir do nome do arquivo (formato camelCase)
  let varName = filename
    .split('.')[0] // Remover extensão
    .replace(/[^a-zA-Z0-9]/g, ' ') // Substituir caracteres especiais por espaços
    .split(' ')
    .filter(Boolean)
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
  
  // Adicionar sufixo Img para identificar que é uma imagem
  varName = `${varName}Img`;
  
  // Obter posição do cursor
  const cursorStart = textArea.selectionStart;
  const cursorEnd = textArea.selectionEnd;
  
  // Abordagem alternativa que não depende de importações e declarações
  // Em vez disso, usamos a URL diretamente no atributo src
  
  // Tag de imagem para inserir no cursor - usando sintaxe MDX direta sem componente
  const imageTag = `![${filename}](${imageUrl})\n\n`;
  
  // Construir conteúdo atualizado
  let updatedContent = content;
  
  // Inserir tag da imagem na posição do cursor
  updatedContent = 
    updatedContent.substring(0, cursorStart) + 
    imageTag + 
    updatedContent.substring(cursorEnd);
  
  // Focar o textarea e posicionar o cursor após a tag inserida
  setTimeout(() => {
    textArea.focus();
    const newCursorPos = cursorStart + imageTag.length;
    textArea.setSelectionRange(newCursorPos, newCursorPos);
  }, 0);
  
  return updatedContent;
}

/**
 * Função alternativa para inserir referência de imagem usando o componente Image do Next.js
 * com sintaxe mais compatível com MDX
 * 
 * @param content - Conteúdo atual do editor
 * @param filename - Nome do arquivo da imagem
 * @param imageUrl - URL da imagem
 * @param textArea - Referência ao elemento textarea
 * @returns Conteúdo atualizado com a referência da imagem
 */
export function insertNextImageInEditor(
  content: string, 
  filename: string, 
  imageUrl: string, 
  textArea: HTMLTextAreaElement | null
): string {
  if (!textArea || !filename || !imageUrl) {
    return content;
  }
  
  // Obter posição do cursor
  const cursorStart = textArea.selectionStart;
  const cursorEnd = textArea.selectionEnd;
  
  // Usar uma abordagem mais simples com o atributo src como string para maior compatibilidade
  const imageTag = `<Image 
src="${imageUrl}"
alt="${filename}"
width={800}
height={500}
/>\n\n`;
  
  // Verificar se já existe importação de Image
  const hasImageImport = content.includes('import Image from');
  
  // Adicionar importação se necessário
  let updatedContent = content;
  if (!hasImageImport) {
    updatedContent = `import Image from 'next/image';\n\n${updatedContent}`;
  }
  
  // Inserir tag da imagem na posição do cursor
  updatedContent = 
    updatedContent.substring(0, cursorStart) + 
    imageTag + 
    updatedContent.substring(cursorEnd);
  
  // Focar o textarea e posicionar o cursor após a tag inserida
  setTimeout(() => {
    textArea.focus();
    const newCursorPos = cursorStart + imageTag.length;
    textArea.setSelectionRange(newCursorPos, newCursorPos);
  }, 0);
  
  return updatedContent;
} 