'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import slugify from 'slugify';

import { useCreateArticle, useUpdateArticle } from '@/hooks/useArticleMutations';
import { useUploadFile } from '@/hooks/useStorageMutations';
import { insertImageInEditor } from '@/utils/image-editor';
import ImagePreview from './ImagePreview';

interface ArticleEditorProps {
  article?: {
    id?: string; 
    title?: string;
    description?: string;
    author?: string;
    date?: string;
    content?: string;
    slug?: string;
    imageUrls?: Record<string, string>;
    tags?: string[];
  } | null;
}

interface ArticleData {
  title: string;
  description: string;
  author: string;
  date: string;
  slug: string;
  content: string;
  imageUrls: Record<string, string>;
  tags?: string[];
  id?: string; 
}

export default function ArticleEditor({ article = null }: ArticleEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title || '');
  const [description, setDescription] = useState(article?.description || '');
  const [author, setAuthor] = useState(article?.author || '');
  const [date, setDate] = useState(article?.date || new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState(article?.content || '');
  const [tagsInput, setTagsInput] = useState(article?.tags?.join(', ') || '');
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingImages, setExistingImages] = useState<Record<string, string>>(article?.imageUrls || {});  
  const [imageObjectURLs, setImageObjectURLs] = useState<string[]>([]);  
  const [isUploading, setIsUploading] = useState(false);
  const uploadFileMutation = useUploadFile();
  const contentTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const [previewImage, setPreviewImage] = useState<{file: File, url: string} | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const createArticleMutation = useCreateArticle();
  const updateArticleMutation = useUpdateArticle();
  
  const isLoading = createArticleMutation.isPending || updateArticleMutation.isPending || isUploading;
  
  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setDescription(article.description || '');
      setAuthor(article.author || '');
      setDate(article.date || '');
      setContent(article.content || '');
      setExistingImages(article.imageUrls || {});
      setTagsInput(article.tags?.join(', ') || '');
    }
  }, [article]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setError('');
    setUploadError(null);
    
    const files = Array.from(e.target.files);
    console.log('Arquivos selecionados:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    // Verificar se são imagens válidas
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setError('Nenhum arquivo de imagem válido selecionado');
      return;
    }
    
    if (validFiles.length === 1) {
      // Se for apenas uma imagem, mostrar a prévia
      const file = validFiles[0];
      console.log('Preparando prévia para:', file.name);
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage({ file, url: previewUrl });
    } else {
      // Se forem múltiplas imagens, adicionar à lista
      console.log('Adicionando múltiplas imagens:', validFiles.length);
      const newImageURLs = validFiles.map(file => URL.createObjectURL(file));
      setImageObjectURLs(prev => [...prev, ...newImageURLs]);
      setImages(prev => [...prev, ...validFiles]);
    }
  };

  const handleImageUpload = async () => {
    if (!previewImage) return;
    
    setIsUploading(true);
    setError('');
    setUploadError(null);
    
    try {
      console.log('Iniciando upload da imagem:', previewImage.file.name);
      const slug = slugify(title, { lower: true });
      const result = await uploadFileMutation.mutateAsync({
        file: previewImage.file,
        folder: `articles/${slug}`
      });
      
      console.log('Upload bem-sucedido, resultado:', result);
      
      // Adicionar a imagem à lista de imagens existentes
      setExistingImages(prev => ({
        ...prev,
        [previewImage.file.name]: result.url
      }));
      
      // Limpar a prévia
      URL.revokeObjectURL(previewImage.url);
      setPreviewImage(null);
      setIsUploading(false);
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      setUploadError(error.message || 'Falha ao fazer upload da imagem');
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {    
    if (imageObjectURLs[index]) {
      URL.revokeObjectURL(imageObjectURLs[index]);
    }
    setImageObjectURLs(prev => prev.filter((_, i) => i !== index));
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (filename: string) => {
    setExistingImages((prev) => {
      const newImages = { ...prev };
      delete newImages[filename];
      return newImages;
    });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const uploadImagesToFirebase = async () => {    
    const folderPath = article?.slug || slugify(title, { lower: true });
    
    // Se não houver imagens para upload, retornar objeto vazio
    if (images.length === 0) {
      return {};
    }
    
    setIsUploading(true);
    
    try {
      const imageUploadPromises = images.map(async (img) => {
        try {        
          const result = await uploadFileMutation.mutateAsync({
            file: img,
            folder: `articles/${folderPath}`
          });        
          return { name: img.name, url: result.url };
        } catch (error) {
          console.error(`Erro ao enviar imagem ${img.name}:`, error);
          throw error;
        }
      });
      
      const uploadedImageResults = await Promise.all(imageUploadPromises);    
      
      const uploadedImagesMap: Record<string, string> = {};
      uploadedImageResults.forEach(({ name, url }) => {
        uploadedImagesMap[name] = url;
      });
      
      setIsUploading(false);
      return uploadedImagesMap;
    } catch (error) {
      setIsUploading(false);
      throw error;
    }
  };

  const parseTags = (tagsString: string): string[] => {
    if (!tagsString.trim()) return [];
    
    return tagsString
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
  };

  const saveArticle = async () => {
    try {
      setError('');
      
      if (!title || !description || !author || !date) {
        setError('Todos os campos são obrigatórios');
        return;
      }
      
      const slug = article?.slug || slugify(title, { lower: true });
      
      // Upload das imagens e obtenção das URLs
      const uploadedImagesMap = await uploadImagesToFirebase();      
      
      // Combinar imagens existentes com novas imagens
      const finalImageUrls = { ...existingImages, ...uploadedImagesMap };
      
      const tags = parseTags(tagsInput);    
      
      if (article?.id) {
        await updateArticleMutation.mutateAsync({
          id: article.id,
          title,
          description,
          author,
          date,
          slug,
          content,
          tags: tags.length > 0 ? tags : undefined,
          existingImages: finalImageUrls,
          images
        });
      } else {
        await createArticleMutation.mutateAsync({
          title,
          description,
          author,
          date,
          slug,
          content,
          tags: tags.length > 0 ? tags : undefined,
          existingImages: finalImageUrls,
          images
        });
      }
      
      router.push('/admin/gerenciar-artigos');
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao salvar artigo:', err);
    }
  };
  
  useEffect(() => {
    return () => {
      imageObjectURLs.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imageObjectURLs]);
 
  const renderUploadProgress = () => {
    if (!isUploading) return null;
    
    return (
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div className="bg-blue-600 h-2.5 rounded-full w-full animate-pulse"></div>
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Enviando imagem...
        </p>
      </div>
    );
  };

  const insertImageInContent = (filename: string, imageUrl: string) => {
    if (contentTextAreaRef.current) {
      const textArea = contentTextAreaRef.current;
      const updatedContent = insertImageInEditor(
        content,
        filename,
        imageUrl,
        textArea
      );
      setContent(updatedContent);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
          Título
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
          placeholder="Título do artigo"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
          Descrição
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
          placeholder="Descrição do artigo"
          rows={2}
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
            Autor
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            placeholder="Nome do autor"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
            Data
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            required
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
          Tags (separadas por vírgula)
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
          placeholder="frontend, react, nextjs"
        />
      </div>
      
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 dark:text-zinc-300 font-medium mb-2">
              Imagens
            </label>
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                multiple
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                disabled={isUploading}
              >
                Selecionar Imagens
              </button>
            </div>
            
            {uploadError && (
              <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                {uploadError}
              </div>
            )}
            
            {previewImage && (
              <div className="mt-4">
                <ImagePreview 
                  file={previewImage.file} 
                  previewUrl={previewImage.url}
                  maxWidth={500}
                  maxHeight={500}
                />
                <div className="mt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(previewImage.url);
                      setPreviewImage(null);
                    }}
                    className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                    disabled={isUploading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Enviando...' : 'Inserir Imagem'}
                  </button>
                </div>
              </div>
            )}
            
            {renderUploadProgress()}
          </div>
          
          {/* Imagens para upload em lote */}
          {images.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Imagens para upload em lote</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Estas imagens serão enviadas quando você salvar o artigo.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800">
                      <Image
                        src={imageObjectURLs[index]}
                        alt={file.name}
                        width={200}
                        height={200}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="mt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Imagens existentes */}
        {Object.keys(existingImages).length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Imagens existentes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.entries(existingImages).map(([filename, url]) => (
                <div key={filename} className="relative group">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800">
                    <Image
                      src={url}
                      alt={filename}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="mt-1 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => insertImageInContent(filename, url)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Inserir
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExistingImage(filename)}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                    {filename}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
          Conteúdo (Markdown)
        </label>
        <textarea
          ref={contentTextAreaRef}
          value={content}
          onChange={handleContentChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white font-mono"
          placeholder="Conteúdo do artigo em Markdown"
          rows={15}
        />
      </div>
      
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.push('/admin/gerenciar-artigos')}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={saveArticle}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : article ? 'Atualizar' : 'Publicar'}
        </button>
      </div>
    </div>
  );
} 