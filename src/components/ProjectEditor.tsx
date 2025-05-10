'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import slugify from 'slugify';
import { useCreateProject, useUpdateProject } from '@/hooks/useProjectMutations';
import { useUploadFile } from '@/hooks/useStorageMutations';
import ImagePreview from './ImagePreview';

interface ProjectEditorProps {
  project?: {
    id?: string;
    name?: string;
    description?: string;
    link?: { href: string; label: string };
    logo?: string;
    tags?: string[];
  } | null;
}

export default function ProjectEditor({ project = null }: ProjectEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [linkHref, setLinkHref] = useState(project?.link?.href || '');
  const [linkLabel, setLinkLabel] = useState(project?.link?.label || '');
  const [tagsInput, setTagsInput] = useState(project?.tags?.join(', ') || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(project?.logo || null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const uploadFileMutation = useUploadFile();
  
  const isLoading = createProjectMutation.isPending || updateProjectMutation.isPending || isUploading;

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setLinkHref(project.link?.href || '');
      setLinkLabel(project.link?.label || '');
      setTagsInput(project.tags?.join(', ') || '');
      setLogoPreview(project.logo || null);
    }
  }, [project]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      setError('O arquivo selecionado não é uma imagem válida.');
      return;
    }
    
    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
  };

  const uploadLogoToFirebase = async (slug: string): Promise<string | null> => {
    if (!logoFile) return project?.logo || null;
    
    try {
      setIsUploading(true);
      const result = await uploadFileMutation.mutateAsync({
        file: logoFile,
        folder: `projects/${slug}`
      });
      setIsUploading(false);
      return result.url;
    } catch (error) {
      setIsUploading(false);
      console.error('Erro ao fazer upload do logo:', error);
      throw new Error('Falha ao fazer upload do logo');
    }
  };

  const parseTags = (tagsString: string): string[] => {
    if (!tagsString.trim()) return [];
    
    return tagsString
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
  };

  const saveProject = async () => {
    try {
      setError('');
      
      if (!name || !description) {
        setError('Nome e descrição são obrigatórios');
        return;
      }
      
      const slug = slugify(name, { lower: true });      
      
      const logoUrl = await uploadLogoToFirebase(slug);      
      
      const tags = parseTags(tagsInput);      
      
      if (project?.id) {
        await updateProjectMutation.mutateAsync({
          id: project.id,
          name,
          description,
          link: {
            href: linkHref,
            label: linkLabel || linkHref
          },
          logo: logoUrl || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
      } else {
        await createProjectMutation.mutateAsync({
          name,
          description,
          link: {
            href: linkHref,
            label: linkLabel || linkHref
          },
          logo: logoUrl || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
      }
      
      router.push('/admin/gerenciar-projetos');
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao salvar projeto:', err);
    }
  };
  
  useEffect(() => {
    return () => {
      if (logoPreview && logoFile) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview, logoFile]);

  const renderUploadProgress = () => {
    if (!isUploading) return null;
    
    return (
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div className="bg-blue-600 h-2.5 rounded-full w-full animate-pulse"></div>
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Processando e enviando imagem...
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-700 dark:text-zinc-300 font-medium mb-2">
          Nome do Projeto
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
          required
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="description" className="block text-gray-700 dark:text-zinc-300 font-medium mb-2">
          Descrição
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
          required
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="linkHref" className="block text-gray-700 dark:text-zinc-300 font-medium mb-2">
          URL do Projeto
        </label>
        <input
          type="url"
          id="linkHref"
          value={linkHref}
          onChange={(e) => setLinkHref(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="linkLabel" className="block text-gray-700 dark:text-zinc-300 font-medium mb-2">
          Texto do Link
        </label>
        <input
          type="text"
          id="linkLabel"
          value={linkLabel}
          onChange={(e) => setLinkLabel(e.target.value)}
          placeholder="github.com"
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="tags" className="block text-gray-700 dark:text-zinc-300 font-medium mb-2">
          Tecnologias (separadas por vírgula)
        </label>
        <input
          type="text"
          id="tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="typescript, next.js, tailwind, etc."
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          Ex: typescript, next.js, tailwind, firebase
        </p>
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 dark:text-zinc-300 font-medium mb-2">
          Logo do Projeto
        </label>
        <div className="flex items-center space-x-4">
          {logoPreview && !logoFile && (
            <div className="relative w-36 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-700 p-2">
              <Image
                src={logoPreview}
                alt="Logo preview"
                fill
                className="object-fit"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleLogoChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            disabled={isUploading}
          >
            {logoPreview ? 'Trocar Logo' : 'Selecionar Logo'}
          </button>
          {logoPreview && (
            <button
              type="button"
              onClick={() => {
                setLogoPreview(null);
                setLogoFile(null);
              }}
              className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
              disabled={isUploading}
            >
              Remover Logo
            </button>
          )}
        </div>
        
        {logoFile && logoPreview && (
          <div className="mt-4">
            <ImagePreview 
              file={logoFile} 
              previewUrl={logoPreview}
              maxWidth={500}
              maxHeight={500}
            />
          </div>
        )}
        
        {renderUploadProgress()}
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.push('/admin/gerenciar-projetos')}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={saveProject}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : project ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </div>
  );
} 
