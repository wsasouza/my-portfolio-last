import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Função para salvar uma imagem no sistema de arquivos local
 * 
 * @param fileBuffer Buffer do arquivo a ser salvo
 * @param originalName Nome original do arquivo
 * @param folder Pasta onde o arquivo será salvo (dentro de public/uploads/)
 * @returns URL relativa do arquivo salvo
 */
export async function saveImageToLocal(
  fileBuffer: Buffer, 
  originalName: string, 
  folder: string = 'articles'
): Promise<string> {  
  const fileExtension = path.extname(originalName);
  const fileName = `${uuidv4()}${fileExtension}`;  
  
  const uploadFolder = path.join(process.cwd(), 'public', 'uploads', folder);  
  
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
  }  
  
  const filePath = path.join(uploadFolder, fileName);  
  
  fs.writeFileSync(filePath, fileBuffer);  
 
  return `/uploads/${folder}/${fileName}`;
}

/**
 * Função para excluir uma imagem do sistema de arquivos local
 * 
 * @param imageUrl URL relativa da imagem a ser excluída
 * @returns boolean indicando sucesso
 */
export function deleteImageFromLocal(imageUrl: string): boolean {
  try {   
    const filePath = path.join(process.cwd(), 'public', imageUrl);    
    
    if (fs.existsSync(filePath)) {      
      fs.unlinkSync(filePath);
      console.log(`Arquivo excluído com sucesso: ${filePath}`);
      return true;
    } else {
      console.warn(`Arquivo não encontrado: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Erro ao excluir arquivo: ${(error as Error).message}`);
    return false;
  }
} 