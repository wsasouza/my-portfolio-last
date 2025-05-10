'use client'

import Image from 'next/image'
import { useProject } from '@/hooks/useProjects'
import { LinkIcon } from '@/components/Icons'

interface ProjectDetailProps {
  id: string
}

export default function ProjectDetail({ id }: ProjectDetailProps) {
  const { data, isLoading, error } = useProject(id)
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-zinc-200 dark:bg-zinc-700 rounded w-40 mb-6"></div>
        <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3"></div>
      </div>
    )
  }
  
  if (error instanceof Error) {
    return (
      <div className="text-red-500 dark:text-red-400">
        Erro ao carregar projeto: {error.message}
      </div>
    )
  }
  
  if (!data?.project) {
    return (
      <div className="text-zinc-500 dark:text-zinc-400">
        Projeto não encontrado.
      </div>
    )
  }
  
  const project = data.project
  
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        {project.logo && (
          <div className="relative z-10 flex h-24 w-48 px-2 items-center justify-center rounded-lg bg-zinc-50 shadow-md ring-1 shadow-zinc-800/5 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-700 dark:ring-0 mr-6">
            <Image
              src={project.logo}
              alt={project.name}
              className="h-20 w-auto object-fill"
              width={300}
              height={300}
              unoptimized
            />
          </div>
        )}
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {project.name}
        </h1>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Descrição
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          {project.description}
        </p>
      </div>
      
      {project.tags && project.tags.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Tecnologias
          </h2>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span 
                key={tag} 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {project.link?.href && (
        <div className="mb-6">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Link
          </h2>
          <a 
            href={project.link.href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <LinkIcon className="h-5 w-5 mr-2" />
            {project.link.label || project.link.href}
          </a>
        </div>
      )}
    </div>
  )
} 
