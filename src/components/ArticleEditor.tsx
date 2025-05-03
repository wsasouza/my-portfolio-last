'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import slugify from 'slugify';

interface ArticleEditorProps {
  article?: {
    id?: string; // ID do documento do Firestore
    articleId?: string; // ID do artigo (mesmo que o ID do documento)
    title?: string;
    description?: string;
    author?: string;
    date?: string;
    content?: string;
    slug?: string;
    imageUrls?: Record<string, string>;
  } | null;
}

export default function ArticleEditor({ article = null }: ArticleEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title || '');
  const [description, setDescription] = useState(article?.description || '');
  const [author, setAuthor] = useState(article?.author || '');
  const [date, setDate] = useState(article?.date || new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState(article?.content || '');
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingImages, setExistingImages] = useState<Record<string, string>>(article?.imageUrls || {});
  const [markdownEditorValue, setMarkdownEditorValue] = useState('');
  
  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setDescription(article.description || '');
      setAuthor(article.author || '');
      setDate(article.date || '');
      setContent(article.content || '');
      setExistingImages(article.imageUrls || {});
    }
  }, [article]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    console.log(`Selecionado ${files.length} arquivo(s) de imagem`);
    
    // Verificar se os arquivos são válidos
    files.forEach((file, index) => {
      console.log(`Arquivo ${index + 1}: ${file.name}, tipo: ${file.type}, tamanho: ${file.size} bytes`);
      if (!file.type.startsWith('image/')) {
        console.warn(`Aviso: O arquivo ${file.name} não parece ser uma imagem válida (tipo: ${file.type})`);
      }
    });
    
    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
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
      console.log(`Slug gerado: ${slug}`);
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('author', author);
      formData.append('date', date);
      formData.append('slug', slug);
      
      // Se estiver editando um artigo existente, adicione o ID do artigo
      if (article?.id) {
        console.log(`Editando artigo existente com ID: ${article.id}`);
        formData.append('articleId', article.id);
      } else {
        console.log('Criando novo artigo');
      }
      formData.append('content', content);
      
      // Adicionar imagens novas
      console.log(`Adicionando ${images.length} imagens novas ao FormData`);
      images.forEach((img, index) => {
        console.log(`Anexando imagem ${index + 1}: ${img.name} (${img.size} bytes) ao FormData`);
        formData.append('images', img);
      });
      
      // Adicionar referências a imagens existentes
      console.log(`Adicionando ${Object.keys(existingImages).length} imagens existentes`);
      formData.append('existingImages', JSON.stringify(existingImages));
      
      console.log(`Enviando requisição ${article ? 'PUT' : 'POST'} para /api/articles`);
      const response = await fetch(`/api/articles`, {
        method: article ? 'PUT' : 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar artigo');
      }
      
      router.push('/admin/articles');
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao salvar artigo:', err);
    } finally {
      setIsLoading(false);
    }
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
          <label className="block mb-2">Imagens</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            multiple
            accept="image/*"
            className="mb-2"
          />
          
          {/* Exibir imagens existentes */}
          {Object.keys(existingImages).length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Imagens existentes:</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(existingImages).map(([filename, url]) => (
                  <div key={filename} className="relative">
                    <img
                      src={url}
                      alt={filename}
                      className="h-20 w-20 object-cover rounded"
                    />
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
          
          {/* Exibir novas imagens */}
          {images.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Novas imagens:</h3>
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={URL.createObjectURL(img)}
                      alt={img.name}
                      className="h-20 w-20 object-cover rounded"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                      title="Remover imagem"
                    >
                      &times;
                    </button>
                    <span className="text-xs mt-1 block truncate max-w-[80px]">{img.name}</span>
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
          value={content}
          onChange={handleContentChange}
          className="w-full p-2 border rounded font-mono dark:bg-zinc-800 dark:border-zinc-700"
          rows={15}
        />
        
        <div className="mt-4 text-sm text-zinc-500">
          <p>Dicas:</p>
          <ul className="list-disc pl-5">
            <li>Use <code>{'<Image src={image1} alt="Descrição" />'}</code> para inserir imagens</li>
            <li>Use ## para títulos de seção</li>
            <li>Use **texto** para negrito</li>
            <li>Use *texto* para itálico</li>
          </ul>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => router.push('/admin/articles')}
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