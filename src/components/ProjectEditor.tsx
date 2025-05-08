'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import slugify from 'slugify';
import useFirebaseStorage from '@/hooks/useFirebaseStorage';

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

interface ProjectData {
  name: string;
  description: string;
  link: { href: string; label: string };
  logo?: string;
  tags?: string[];
  id?: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage } = useFirebaseStorage();

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
      const logoUrl = await uploadImage(logoFile, `projects/${slug}`);
      return logoUrl;
    } catch (error) {
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
      setIsLoading(true);
      setError('');
      
      if (!name || !description) {
        setError('Nome e descrição são obrigatórios');
        setIsLoading(false);
        return;
      }
      
      const slug = slugify(name, { lower: true });
      
      // Upload do logo para o Firebase Storage
      const logoUrl = await uploadLogoToFirebase(slug);
      
      // Processar tags
      const tags = parseTags(tagsInput);
      
      // Preparar dados do projeto
      const projectData: ProjectData = {
        name,
        description,
        link: {
          href: linkHref,
          label: linkLabel || linkHref
        },
        logo: logoUrl || undefined,
        tags: tags.length > 0 ? tags : undefined,
      };
      
      // Se estiver editando um projeto existente, adicione o ID
      if (project?.id) {
        projectData.id = project.id;
      }
      
      // Enviar dados do projeto para a API
      const response = await fetch(`/api/projects`, {
        method: project ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar projeto');
      }
      
      router.push('/admin/gerenciar-projetos');
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao salvar projeto:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar a URL do objeto ao desmontar o componente
  useEffect(() => {
    return () => {
      if (logoPreview && logoFile) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview, logoFile]);

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
          {logoPreview && (
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
            className="block w-full text-sm text-gray-500 dark:text-zinc-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              dark:file:bg-blue-900 dark:file:text-blue-200
              hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          SVG, PNG ou JPG 
        </p>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.push('/admin/gerenciar-projetos')}
          className="px-4 py-2 text-gray-700 dark:text-zinc-300 mr-2"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={saveProject}
          disabled={isLoading}
          className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Salvando...' : project ? 'Atualizar Projeto' : 'Criar Projeto'}
        </button>
      </div>
    </div>
  );
} 
