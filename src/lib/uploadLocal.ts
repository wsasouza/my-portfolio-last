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
  // Criar um nome de arquivo único
  const fileExtension = path.extname(originalName);
  const fileName = `${uuidv4()}${fileExtension}`;
  
  // Caminho da pasta destino
  const uploadFolder = path.join(process.cwd(), 'public', 'uploads', folder);
  
  // Criar pasta se não existir
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
  }
  
  // Caminho completo do arquivo
  const filePath = path.join(uploadFolder, fileName);
  
  // Salvar arquivo
  fs.writeFileSync(filePath, fileBuffer);
  
  console.log(`Arquivo salvo localmente em: ${filePath}`);
  
  // Retornar URL relativa do arquivo
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
    // A URL relativa começa com /uploads/...
    // Obtemos o caminho completo do arquivo
    const filePath = path.join(process.cwd(), 'public', imageUrl);
    
    // Verificar se arquivo existe
    if (fs.existsSync(filePath)) {
      // Excluir arquivo
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