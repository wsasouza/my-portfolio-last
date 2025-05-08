import { type Metadata } from 'next'

import { SimpleLayout } from '@/components/SimpleLayout'

export const metadata: Metadata = {
  title: 'Obrigado por se inscrever',
  description: 'Obrigado por se inscrever na minha newsletter.',
}

export default function ThankYou() {
  return (
    <SimpleLayout
      title="Obrigado por se inscrever."
      intro="Vou enviar um email sempre que publicar um novo post no blog, lançar um novo projeto ou tiver algo interessante para compartilhar. Você pode cancelar a assinatura a qualquer momento, sem nenhum sentimento."
    />
  )
}
