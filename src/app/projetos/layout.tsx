import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projetos',
  description: 'Projetos que desenvolvi ao longo dos anos.',
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 