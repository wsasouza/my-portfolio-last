'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import slugify from 'slugify';
import useFirebaseStorage from '@/hooks/useFirebaseStorage';
import { insertImageInEditor, insertNextImageInEditor } from '@/utils/image-editor';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingImages, setExistingImages] = useState<Record<string, string>>(article?.imageUrls || {});  
  const [imageObjectURLs, setImageObjectURLs] = useState<string[]>([]);  
  const { uploadImage, uploadState } = useFirebaseStorage();
  const contentTextAreaRef = useRef<HTMLTextAreaElement>(null);
  
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);    
    
    files.forEach((file) => {      
      if (!file.type.startsWith('image/')) {
        console.warn(`Aviso: O arquivo ${file.name} não parece ser uma imagem válida (tipo: ${file.type})`);
      }
    });    
    
    const newImageURLs = files.map(file => URL.createObjectURL(file));
    setImageObjectURLs(prev => [...prev, ...newImageURLs]);
    
    setImages((prev) => [...prev, ...files]);
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
    
    const imageUploadPromises = images.map(async (img) => {
      try {        
        const imageUrl = await uploadImage(img, `articles/${folderPath}`);        
        return { name: img.name, url: imageUrl };
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
    
    return uploadedImagesMap;
  };

  const parseTags = (tagsString: string): string[] => {
    if (!tagsString.trim()) return [];
    
    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  };

  const saveArticle = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!title || !description || !author || !date) {
        setError('Todos os campos são obrigatórios');
        setIsLoading(false);
        return;
      }
      
      const slug = article?.slug || slugify(title, { lower: true });
      
      const uploadedImagesMap = images.length > 0 ? await uploadImagesToFirebase() : {};      
      
      const allImages = { ...existingImages, ...uploadedImagesMap };  
      
      const tags = parseTags(tagsInput);    
      
      const articleData: ArticleData = {
        title,
        description,
        author,
        date,
        slug,
        content,
        imageUrls: allImages,
        tags: tags.length > 0 ? tags : undefined,
      };      
      
      if (article?.id) {        
        articleData.id = article.id;
      } 

      const response = await fetch(`/api/articles-client`, {
        method: article ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar artigo');
      }
      
      router.push('/admin/gerenciar-artigos');
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao salvar artigo:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    return () => {
      imageObjectURLs.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imageObjectURLs]);
 
  const renderUploadProgress = (filename: string) => {
    const state = uploadState[filename];
    if (!state || !state.isUploading) return null;
    
    return (
      <div className="text-xs mt-1">
        <div className="h-1 w-full bg-gray-200 rounded overflow-hidden">
          <div
            className="h-full bg-blue-500"
            style={{ width: `${state.progress}%` }}
          />
        </div>
        <span className="text-gray-500">{state.progress}%</span>
      </div>
    );
  };
  
  const insertImageInContent = (filename: string, imageUrl: string) => {
    const updatedContent = insertImageInEditor(
      content,
      filename,
      imageUrl,
      contentTextAreaRef.current
    );
    setContent(updatedContent);
  };  

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">
        {article ? 'Editar Artigo' : 'Criar Novo Artigo'}
      </h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid gap-4 mb-6">
        <div>
          <label className="block mb-2">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
          />
        </div>
        
        <div>
          <label className="block mb-2">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Autor</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
            />
          </div>
          
          <div>
            <label className="block mb-2">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
            />
          </div>
        </div>
        
        <div>
          <label className="block mb-2">Tags (separadas por vírgula)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="frontend, backend, javascript, etc."
            className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Ex: frontend, backend, devops, typescript
          </p>
        </div>
        
        <div>
          <label className="block mb-2">Imagens</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            multiple
            accept="image/*"
            className="mb-2"
          />          
          
          {Object.keys(existingImages).length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Imagens existentes:</h3>
              <div className="flex flex-wrap gap-4 mb-8">
                {Object.entries(existingImages).map(([filename, url]) => (
                  <div key={filename} className="relative">
                    <div className="h-20 w-32 relative">
                      <Image
                        src={url}
                        alt={filename}
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                    <div className="absolute flex space-x-1 -bottom-6 left-0 right-0">
                      <button
                        onClick={() => insertImageInContent(filename, url)}
                        className="bg-green-500 text-white text-xs rounded px-1 py-0.5 hover:bg-green-600 cursor-pointer"
                        title="Inserir como Markdown"
                      >
                        MD
                      </button>                      
                    </div>
                    <button
                      onClick={() => removeExistingImage(filename)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                      title="Remover imagem"
                    >
                      &times;
                    </button>
                    <span className="text-xs mt-1 block truncate max-w-[80px]">{filename}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          
          {images.length > 0 && (
            <div className="mt-8">
              <h3 className="font-medium mb-2">Novas imagens:</h3>
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    {/* Usar URL segura para preview */}
                    <div className="h-20 w-20 relative">
                      <Image
                        src={imageObjectURLs[idx] || ''}
                        alt={img.name}
                        fill
                        className="object-contain rounded"
                        unoptimized
                      />
                    </div>
                    {uploadState[img.name]?.url && (
                      <div className="absolute flex space-x-1 -bottom-6 left-0 right-0">
                        <button
                          onClick={() => insertImageInContent(img.name, uploadState[img.name]?.url || '')}
                          className="bg-green-500 text-white text-xs rounded px-1 py-0.5 hover:bg-green-600"
                          title="Inserir como Markdown"
                        >
                          MD
                        </button>                        
                      </div>
                    )}
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                      title="Remover imagem"
                    >
                      &times;
                    </button>
                    <span className="text-xs mt-1 block truncate max-w-[80px]">{img.name}</span>
                    {renderUploadProgress(img.name)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block mb-2">Conteúdo (MDX)</label>
        <textarea
          ref={contentTextAreaRef}
          value={content}
          onChange={handleContentChange}
          className="w-full p-2 border rounded font-mono dark:bg-zinc-800 dark:border-zinc-700"
          rows={15}
        />
        
        <div className="mt-4 text-sm text-zinc-500">
          <p>Dicas:</p>
          <ul className="list-disc pl-5">            
            <li>Use o botão <strong>MD</strong> para inserir imagens como Markdown</li>           
            <li>Use <code>{'[Texto do link](https://exemplo.com)'}</code> para inserir links</li>            
            <li>Use ## para títulos de seção</li>
            <li>Use **texto** para negrito</li>
            <li>Use *texto* para itálico</li>
          </ul>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => router.push('/admin/gerenciar-artigos')}
          className="px-4 py-2 mr-2 bg-zinc-200 rounded dark:bg-zinc-700"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          onClick={saveArticle}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : article ? 'Atualizar' : 'Publicar'} Artigo
        </button>
      </div>
    </div>
  );
} 