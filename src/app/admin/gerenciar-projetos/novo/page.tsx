import ProjectEditor from '@/components/ProjectEditor';
import { SimpleLayout } from '@/components/SimpleLayout';

export default function NewProjectPage() {
  return (
    <SimpleLayout title="Novo Projeto" intro="Crie um novo projeto para seu portfólio">
      <ProjectEditor />
    </SimpleLayout>
  );
} 