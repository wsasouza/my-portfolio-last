import { Suspense } from 'react';
import { SimpleLayout } from '@/components/SimpleLayout';
import { ArticlesLoading } from '@/components/ArticlesLoading';
import { AdminArticlesContent } from '@/components/AdminArticlesContent';

export default function AdminArticlesPage() {
  return (
    <SimpleLayout
      title="Gerenciamento de Artigos"
      intro="Aqui você pode criar, editar e excluir artigos do blog."
    >
      <Suspense fallback={<ArticlesLoading />}>
        <AdminArticlesContent />
      </Suspense>
    </SimpleLayout>
  );
}
