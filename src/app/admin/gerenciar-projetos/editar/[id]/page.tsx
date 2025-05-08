'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProjectEditor from '@/components/ProjectEditor';
import { SimpleLayout } from '@/components/SimpleLayout';

export default function EditProjectPage() {
  const params = useParams();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar projeto');
        }
        
        setProject(data.project);
      } catch (err: any) {
        setError(err.message);
        console.error('Erro ao buscar projeto:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  if (isLoading) {
    return <div className="container mx-auto py-8 px-4">Carregando...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      </div>
    );
  }

  return <SimpleLayout title="Editar Projeto" intro="Edite as informações do projeto"><ProjectEditor project={project} /></SimpleLayout>;
} 
