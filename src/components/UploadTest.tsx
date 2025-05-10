'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useUploadFile } from '@/hooks/useStorageMutations';

export default function UploadTest() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadFileMutation = useUploadFile();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    setError(null);
    const selectedFile = e.target.files[0];
    
    if (!selectedFile.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida');
      return;
    }
    
    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    setUploadedUrl(null);
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Nenhum arquivo selecionado');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await uploadFileMutation.mutateAsync({
        file,
        folder: 'test-uploads'
      });
      
      setUploadedUrl(result.url);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload do arquivo');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Teste de Upload</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          Selecionar Arquivo
        </button>
      </div>
      
      {preview && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Arquivo selecionado: {file?.name}</p>
          <div className="relative h-48 w-full border rounded overflow-hidden">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
            />
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2 disabled:bg-gray-300"
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Fazer Upload'}
            </button>
            <button
              onClick={() => {
                if (preview) URL.revokeObjectURL(preview);
                setFile(null);
                setPreview(null);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
              disabled={isLoading}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      
      {uploadedUrl && (
        <div className="mt-4">
          <h3 className="font-bold text-green-600 mb-2">Upload concluído!</h3>
          <div className="relative h-48 w-full border rounded overflow-hidden">
            <Image
              src={uploadedUrl}
              alt="Uploaded"
              fill
              className="object-contain"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2 break-all">
            URL: {uploadedUrl}
          </p>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-500">
        <p>Status: {uploadFileMutation.status}</p>
        {uploadFileMutation.error && (
          <p className="text-red-500">Erro: {(uploadFileMutation.error as Error).message}</p>
        )}
      </div>
    </div>
  );
} 
