import ArticleEditor from '@/components/ArticleEditor';
import { SimpleLayout } from '@/components/SimpleLayout';

export default function NewArticlePage() {
  return (
    <SimpleLayout title="New Article" intro="Create a new article">
      <ArticleEditor />
    </SimpleLayout>
  );
} 