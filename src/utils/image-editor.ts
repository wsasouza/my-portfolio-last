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

  let varName = filename
    .split('.')[0] 
    .replace(/[^a-zA-Z0-9]/g, ' ') 
    .split(' ')
    .filter(Boolean)
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');  
  
  varName = `${varName}Img`;
  
  const cursorStart = textArea.selectionStart;
  const cursorEnd = textArea.selectionEnd;  
  
  const imageTag = `![${filename}](${imageUrl})\n\n`;  
  
  let updatedContent = content;  
 
  updatedContent = 
    updatedContent.substring(0, cursorStart) + 
    imageTag + 
    updatedContent.substring(cursorEnd);  
  
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
  
  const cursorStart = textArea.selectionStart;
  const cursorEnd = textArea.selectionEnd;  
  
  const imageTag = `<Image 
src="${imageUrl}"
alt="${filename}"
width={800}
height={500}
/>\n\n`;  
  
  const hasImageImport = content.includes('import Image from');  
  
  let updatedContent = content;
  if (!hasImageImport) {
    updatedContent = `import Image from 'next/image';\n\n${updatedContent}`;
  }  
  
  updatedContent = 
    updatedContent.substring(0, cursorStart) + 
    imageTag + 
    updatedContent.substring(cursorEnd);  

  setTimeout(() => {
    textArea.focus();
    const newCursorPos = cursorStart + imageTag.length;
    textArea.setSelectionRange(newCursorPos, newCursorPos);
  }, 0);
  
  return updatedContent;
} 
