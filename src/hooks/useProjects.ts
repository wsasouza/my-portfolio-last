import { useQuery } from '@tanstack/react-query';

export interface Project {
  id: string;
  name: string;
  description: string;
  link: { href: string; label: string };
  logo?: string;
  tags?: string[];
}

export interface PaginatedProjects {
  projects: Project[];
  totalCount: number;
  hasMore: boolean;
}

interface FetchProjectsParams {
  page?: number;
  limit?: number;
}

async function fetchProjects({ 
  page = 1, 
  limit = 6 
}: FetchProjectsParams): Promise<PaginatedProjects> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  const response = await fetch(`/api/projects?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar projetos');
  }
  
  const data = await response.json();
  return {
    projects: data.projects,
    totalCount: data.pagination.totalCount,
    hasMore: data.pagination.hasMore
  };
}

export function useProjects(options: FetchProjectsParams = {}) {
  return useQuery({
    queryKey: ['projects', options],
    queryFn: () => fetchProjects(options),
  });
}

async function fetchProjectById(id: string): Promise<{ project: Project }> {
  const response = await fetch(`/api/projects/${id}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar projeto');
  }
  
  return response.json();
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProjectById(id!),
    enabled: !!id,
  });
}

async function fetchAllProjects(): Promise<{ projects: Project[] }> {
  const response = await fetch('/api/projects?limit=100');
  
  if (!response.ok) {
    throw new Error('Erro ao buscar todos os projetos');
  }
  
  const data = await response.json();
  return { projects: data.projects };
}

export function useAllProjects() {
  return useQuery({
    queryKey: ['projects', 'all'],
    queryFn: fetchAllProjects,
  });
} 