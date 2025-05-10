import { Metadata } from 'next';
import { getProjectById } from '@/lib/projects';
import { SimpleLayout } from '@/components/SimpleLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import ProjectDetail from '@/components/ProjectDetail';

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const project = await getProjectById(params.id);
  
  if (!project) {
    return {
      title: 'Projeto não encontrado',
      description: 'O projeto que você está procurando não existe.',
    };
  }
  
  return {
    title: project.name,
    description: project.description,
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const breadcrumbItems = [
    {
      label: 'Projetos',
      href: '/projetos',
    },
    {
      label: 'Detalhes',
      href: `/projetos/${params.id}`,
    }
  ];
  
  return (
    <SimpleLayout
      title="Detalhes do Projeto"
      intro="Informações detalhadas sobre este projeto."
    >
      <div className="mb-8">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      
      <ProjectDetail id={params.id} />
    </SimpleLayout>
  );
} 