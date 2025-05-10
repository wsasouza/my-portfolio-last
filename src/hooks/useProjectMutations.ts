import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ProjectFormData {
  name: string;
  description: string;
  link: { href: string; label: string };
  logo?: string;
  tags?: string[];
}

interface UpdateProjectFormData extends ProjectFormData {
  id: string;
}

async function createProject(formData: ProjectFormData) {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao criar projeto');
  }
  
  return response.json();
}

async function updateProject(formData: UpdateProjectFormData) {
  const response = await fetch('/api/projects', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao atualizar projeto');
  }
  
  return response.json();
}

async function deleteProject(id: string) {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao excluir projeto');
  }
  
  return response.json();
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {      
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateProject,
    onSuccess: (data, variables) => {      
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {      
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
} 
