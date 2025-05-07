'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SimpleLayout } from '@/components/SimpleLayout';
import { Pagination } from '@/components/Pagination';
import { useSearchParams } from 'next/navigation';
import logoPlanetaria from '@/images/logos/planetaria.svg';

interface Project {
  id: string;
  name: string;
  description: string;
  link: { href: string; label: string };
  logo?: string;
  tags?: string[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 6,
    totalCount: 0,
    totalPages: 1,
    hasMore: false
  });
  
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('pagina') || '1', 10);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects?page=${currentPage}&limit=6`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar projetos');
        }
        
        setProjects(data.projects);
        setPagination(data.pagination);
      } catch (err: any) {
        setError(err.message);
        console.error('Erro ao buscar projetos:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, [currentPage]);

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir projeto');
      }
      
      // Atualizar a lista após excluir
      setProjects(projects.filter(project => project.id !== id));
      
      // Atualizar contagem total de projetos
      setPagination(prev => ({
        ...prev,
        totalCount: prev.totalCount - 1,
        totalPages: Math.ceil((prev.totalCount - 1) / prev.limit)
      }));
    } catch (err: any) {
      alert(`Erro ao excluir projeto: ${err.message}`);
      console.error('Erro ao excluir projeto:', err);
    }
  };

  return (
    <SimpleLayout
      title="Gerenciamento de Projetos"
      intro="Aqui você pode criar, editar e excluir projetos do portfólio."
    >      
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Gerenciar Projetos</h1>
        <Link 
          href="/admin/gerenciar-projetos/novo" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Novo Projeto
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Carregando projetos...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
              <thead className="bg-gray-50 dark:bg-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-300 uppercase tracking-wider">
                    Projeto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-300 uppercase tracking-wider">
                    Domínio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-300 uppercase tracking-wider">
                    Tecnologias
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-zinc-300 uppercase tracking-wider w-[200px]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-zinc-400">
                      Nenhum projeto encontrado.
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-14 w-28 relative">
                            {project.logo ? (
                              <Image
                                src={project.logo}
                                alt={project.name}
                                width={300}
                                height={300}
                                className="rounded-lg h-10 w-auto object-fill"
                                unoptimized
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                                <span className="text-gray-500 dark:text-zinc-400 text-xs">Logo</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {project.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2 max-w-[300px]">
                              {project.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                        {project.link?.label || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-zinc-400">
                        {project.tags && project.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {project.tags.map(tag => (
                              <span 
                                key={tag} 
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex flex-wrap justify-end gap-3">
                          <Link
                            href={`/admin/gerenciar-projetos/editar/${project.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900"
                          >
                            Editar
                          </Link>
                          <Link
                            href={`/projetos`}
                            className="text-green-600 dark:text-green-400 hover:text-green-900"
                            target="_blank"
                          >
                            Visualizar
                          </Link>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Componente de paginação */}
      <Pagination 
        currentPage={pagination.page} 
        totalPages={pagination.totalPages} 
      />
    </div>
    </SimpleLayout>
  );
} 