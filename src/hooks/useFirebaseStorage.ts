import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase-client';
import { v4 as uuidv4 } from 'uuid';

interface UploadState {
  progress: number;
  url: string | null;
  error: string | null;
  isUploading: boolean;
}

export default function useFirebaseStorage() {
  const [uploadState, setUploadState] = useState<Record<string, UploadState>>({});

  const uploadImage = (file: File, folder: string = 'articles'): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('Nenhum arquivo selecionado'));
        return;
      }

      const fileId = file.name;
      
      // Atualizar estado para este arquivo
      setUploadState(prev => ({
        ...prev,
        [fileId]: {
          progress: 0,
          url: null,
          error: null,
          isUploading: true
        }
      }));

      // Gerar nome de arquivo único
      const uniqueFileName = `${uuidv4()}-${file.name}`;
      // Caminho no Storage
      const storageRef = ref(storage, `${folder}/${uniqueFileName}`);
      
      // Iniciar upload
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Monitorar progresso
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Atualizar progresso
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          
          setUploadState(prev => ({
            ...prev,
            [fileId]: {
              ...prev[fileId],
              progress
            }
          }));
        },
        (error) => {
          // Tratar erro
          setUploadState(prev => ({
            ...prev,
            [fileId]: {
              ...prev[fileId],
              error: error.message,
              isUploading: false
            }
          }));
          
          reject(error);
        },
        async () => {
          // Upload completo, obter URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            setUploadState(prev => ({
              ...prev,
              [fileId]: {
                ...prev[fileId],
                url: downloadURL,
                isUploading: false
              }
            }));
            
            resolve(downloadURL);
          } catch (error: any) {
            setUploadState(prev => ({
              ...prev,
              [fileId]: {
                ...prev[fileId],
                error: error.message,
                isUploading: false
              }
            }));
            
            reject(error);
          }
        }
      );
    });
  };

  const getUploadState = (fileId: string): UploadState => {
    return uploadState[fileId] || {
      progress: 0,
      url: null,
      error: null,
      isUploading: false
    };
  };

  const isUploading = (): boolean => {
    return Object.values(uploadState).some(state => state.isUploading);
  };

  const resetUploadState = (fileId?: string) => {
    if (fileId) {
      setUploadState(prev => {
        const newState = { ...prev };
        delete newState[fileId];
        return newState;
      });
    } else {
      setUploadState({});
    }
  };

  return { 
    uploadImage, 
    getUploadState, 
    isUploading, 
    resetUploadState,
    uploadState 
  };
} 