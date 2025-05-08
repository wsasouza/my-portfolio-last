import { Suspense } from 'react';
import { SimpleLayout } from '@/components/SimpleLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ArticlesLoading } from '@/components/ArticlesLoading';
import { ArticlesContent } from '@/components/ArticlesContent';


const breadcrumbItems = [
  {
    label: 'Artigos',
    href: '/artigos',
  }
];

export default function ArticlesPage() {
  return (
    <SimpleLayout
      title="Escrevendo sobre desenvolvimento e tecnologias que venho explorando."
      intro="Registro dos meus aprendizados enquanto estudo frameworks, ferramentas e boas práticas de desenvolvimento"
    >
      {/* Breadcrumb */}
      <div className="mb-8">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      
      <Suspense fallback={<ArticlesLoading />}>
        <ArticlesContent />
      </Suspense>
    </SimpleLayout>
  );
}
