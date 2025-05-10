import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ArticleFormData {
  title: string;
  description: string;
  author: string;
  date: string;
  slug: string;
  content: string;
  tags?: string[];
  images?: File[];
  existingImages?: Record<string, string>;
}

interface UpdateArticleFormData extends ArticleFormData {
  id: string;
}

async function createArticle(formData: ArticleFormData) {
  const apiFormData = new FormData();
  
  apiFormData.append('title', formData.title);
  apiFormData.append('description', formData.description);
  apiFormData.append('author', formData.author);
  apiFormData.append('date', formData.date);
  apiFormData.append('slug', formData.slug);
  apiFormData.append('content', formData.content);
  
  if (formData.tags && formData.tags.length > 0) {
    apiFormData.append('tags', JSON.stringify(formData.tags));
  }
  
  if (formData.images && formData.images.length > 0) {
    formData.images.forEach(image => {
      apiFormData.append('images', image);
    });
  }
  
  const response = await fetch('/api/articles', {
    method: 'POST',
    body: apiFormData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao criar artigo');
  }
  
  return response.json();
}

async function updateArticle(formData: UpdateArticleFormData) {
  const apiFormData = new FormData();
  
  apiFormData.append('id', formData.id);
  apiFormData.append('title', formData.title);
  apiFormData.append('description', formData.description);
  apiFormData.append('author', formData.author);
  apiFormData.append('date', formData.date);
  apiFormData.append('slug', formData.slug);
  apiFormData.append('content', formData.content);
  
  if (formData.tags && formData.tags.length > 0) {
    apiFormData.append('tags', JSON.stringify(formData.tags));
  }
  
  if (formData.existingImages) {
    apiFormData.append('existingImages', JSON.stringify(formData.existingImages));
  }
  
  if (formData.images && formData.images.length > 0) {
    formData.images.forEach(image => {
      apiFormData.append('images', image);
    });
  }
  
  const response = await fetch('/api/articles', {
    method: 'PUT',
    body: apiFormData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao atualizar artigo');
  }
  
  return response.json();
}

async function deleteArticle(slug: string) {
  const response = await fetch(`/api/articles/${slug}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao excluir artigo');
  }
  
  return response.json();
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createArticle,
    onSuccess: () => {      
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateArticle,
    onSuccess: (data, variables) => {      
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', variables.slug] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {      
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
} 
