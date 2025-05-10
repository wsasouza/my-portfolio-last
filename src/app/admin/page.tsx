import Link from 'next/link';
import { SimpleLayout } from '@/components/SimpleLayout';

export default function AdminPage() {
  return (
    <SimpleLayout
      title="Administração"
      intro="Gerencie seu blog e portfólio."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/gerenciar-artigos"
          className="block p-6 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 shadow hover:bg-gray-50 dark:hover:bg-zinc-700"
        >
          <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Gerenciar Artigos
          </h5>
          <p className="text-gray-700 dark:text-zinc-400">
            Adicione, edite ou remova artigos do blog.
          </p>
        </Link>
        
        <Link
          href="/admin/gerenciar-projetos"
          className="block p-6 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 shadow hover:bg-gray-50 dark:hover:bg-zinc-700"
        >
          <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Gerenciar Projetos
          </h5>
          <p className="text-gray-700 dark:text-zinc-400">
            Adicione, edite ou remova projetos do portfólio.
          </p>
        </Link>
        
        <Link
          href="/admin/teste-upload"
          className="block p-6 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 shadow hover:bg-gray-50 dark:hover:bg-zinc-700"
        >
          <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Teste de Upload
          </h5>
          <p className="text-gray-700 dark:text-zinc-400">
            Teste o upload de imagens para o Firebase Storage.
          </p>
        </Link>
      </div>
    </SimpleLayout>
  );
}
