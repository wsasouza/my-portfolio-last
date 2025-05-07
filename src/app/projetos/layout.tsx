import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projetos',
  description: 'Projetos que desenvolvi ao longo da minha carreira.',
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 