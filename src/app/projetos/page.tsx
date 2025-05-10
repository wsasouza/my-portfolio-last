import { SimpleLayout } from '@/components/SimpleLayout'
import { Breadcrumb } from '@/components/Breadcrumb'
import ProjectsList from '@/components/ProjectsList'

const breadcrumbItems = [
  {
    label: 'Projetos',
    href: '/projetos',
  }
]

export default function Projects() {
  return (
    <SimpleLayout
      title="Projetos que desenvolvi com foco, intenção e propósito."
      intro="A maioria desses projetos foi feita por mim do zero, com algumas contribuições pontuais ao longo do caminho. Cada um reflete meu cuidado com a qualidade, a performance e a entrega de soluções úteis e bem construídas."
    >      
      <div className="mb-8">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      
      <ProjectsList />
    </SimpleLayout>
  )
}
