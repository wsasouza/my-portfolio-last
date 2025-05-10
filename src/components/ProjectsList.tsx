'use client'

import Image from 'next/image'
import { Card } from '@/components/Card'
import { Pagination } from '@/components/Pagination'
import { LinkIcon } from '@/components/Icons'
import { useProjects } from '@/hooks/useProjects'
import { useSearchParams } from 'next/navigation'

export default function ProjectsList() {
  const searchParams = useSearchParams()
  const pageParam = searchParams.get('pagina')
  const currentPage = typeof pageParam === 'string' 
    ? parseInt(pageParam, 10) || 1 : 1
  
  const { data, isLoading, error } = useProjects({
    page: currentPage,
    limit: 6
  })
  
  const projects = data?.projects || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / 6)
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-zinc-200 dark:bg-zinc-700 rounded w-40 mb-6"></div>
            <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }
  
  if (error instanceof Error) {
    return (
      <div className="text-red-500 dark:text-red-400">
        Erro ao carregar projetos: {error.message}
      </div>
    )
  }
  
  if (projects.length === 0) {
    return (
      <>
        <p className="text-center text-zinc-500 dark:text-zinc-400 mt-10">
          Nenhum projeto encontrado.
        </p>
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </>
    )
  }
  
  return (
    <>
      <ul
        role="list"
        className="grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3"
      >
        {projects.map((project) => (
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
        ))}
      </ul>
      
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
      />
    </>
  )
} 
