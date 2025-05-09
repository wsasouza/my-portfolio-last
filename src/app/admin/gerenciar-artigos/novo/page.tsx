import ArticleEditor from '@/components/ArticleEditor';
import { SimpleLayout } from '@/components/SimpleLayout';

export default function NewArticlePage() {
  return (
    <SimpleLayout title="Novo Artigo" intro="Criar novo artigo">
      <ArticleEditor />
    </SimpleLayout>
  );
} 