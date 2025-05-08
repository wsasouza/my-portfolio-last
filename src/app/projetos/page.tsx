import Image from 'next/image'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Pagination } from '@/components/Pagination'
import { getPaginatedProjects } from '@/lib/projects'
import { LinkIcon } from '@/components/Icons'

const breadcrumbItems = [
  {
    label: 'Projetos',
    href: '/projetos',
  }
]

interface ProjectsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Projects({ searchParams }: ProjectsPageProps) {  
  const pageParam = searchParams.pagina;
  const currentPage = typeof pageParam === 'string' 
    ? parseInt(pageParam, 10) || 1     : 1;  
  
  const { projects, totalCount } = await getPaginatedProjects(currentPage, 6);  
  
  const totalPages = Math.ceil(totalCount / 6);

  return (
    <SimpleLayout
      title="Projetos que desenvolvi com foco, intenção e propósito."
      intro="A maioria desses projetos foi feita por mim do zero, com algumas contribuições pontuais ao longo do caminho. Cada um reflete meu cuidado com a qualidade, a performance e a entrega de soluções úteis e bem construídas."
    >      
      <div className="mb-8">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      
      {projects.length === 0 ? (
        <p className="text-center text-zinc-500 dark:text-zinc-400 mt-10">
          Nenhum projeto encontrado.
        </p>
      ) : (
        <ul
          role="list"
          className="grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project) =>  (
              <Card as="li" key={project.id}>
                <div className="relative z-10 flex h-20 w-40 px-2 items-center justify-center rounded-lg bg-zinc-50 shadow-md ring-1 shadow-zinc-800/5 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-700 dark:ring-0">
                  {project.logo && <Image
                    src={project.logo}
                    alt=""
                    className="h-16 w-auto object-fill"
                    width={300}
                    height={300}
                    unoptimized
                  />}
                </div>
                <h2 className="mt-6 text-base font-semibold text-zinc-800 dark:text-zinc-100">
                  {project.link?.href ? (
                    <Card.Link href={project.link.href} target="_blank" rel="noopener noreferrer">{project.name}</Card.Link>
                  ) : (
                    project.name
                  )}
                </h2>
                <Card.Description>{project.description}</Card.Description>
                {project.tags && project.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="relative z-10 mt-6 flex text-sm font-medium text-zinc-400 transition group-hover:text-blue-500 dark:text-zinc-200">
                  <LinkIcon className="h-6 w-6 flex-none" />
                  <span className="ml-2">{project.link?.label || 'Ver projeto'}</span>
                </p>
                
              </Card>
            )
          )}
        </ul>
      )}      
     
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
      />
    </SimpleLayout>
  )
}
