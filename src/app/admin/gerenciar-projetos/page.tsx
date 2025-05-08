import { Suspense } from 'react';
import { SimpleLayout } from '@/components/SimpleLayout';
import { ProjectsLoading } from '@/components/ProjectsLoading';
import { AdminProjectsContent } from '@/components/AdminProjectsContent';

export default function AdminProjectsPage() {
  return (
    <SimpleLayout
      title="Gerenciamento de Projetos"
      intro="Aqui você pode criar, editar e excluir projetos do portfólio."
    >
      <Suspense fallback={<ProjectsLoading />}>
        <AdminProjectsContent />
      </Suspense>
    </SimpleLayout>
  );
}
