import { useMutation } from '@tanstack/react-query';

interface UploadFileParams {
  file: File;
  folder?: string;
}

interface UploadFileResponse {
  success: boolean;
  url: string;
  path: string;
}

async function uploadFile({ file, folder = 'uploads' }: UploadFileParams): Promise<UploadFileResponse> {
  console.log('Iniciando upload de arquivo no cliente:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    folder
  });
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  
  try {
    console.log('Enviando requisição para /api/storage/upload');
    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData,
    });    
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      console.error('Erro na resposta:', errorData);
      throw new Error(errorData.error || `Erro ao fazer upload do arquivo (${response.status})`);
    }
    
    const data = await response.json();   
     
    return data;
  } catch (error) {
    console.error('Erro durante o upload:', error);
    throw error;
  }
}

export function useUploadFile() {
  return useMutation({
    mutationFn: uploadFile,
    onError: (error) => {
      console.error('Erro na mutação de upload:', error);
    }
  });
} 