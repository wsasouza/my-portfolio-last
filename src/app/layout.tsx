import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import { Particles } from '@/components/Particles'

import '@/styles/tailwind.css'
import '@/styles/prism.css'

export const metadata: Metadata = {
  title: {
    template: '%s - Walter S. A. Souza',
    default:
      'Walter S. A. Souza - Desenvolvedor Full Stack',
  },
  description:
    "I'm Spencer, a software designer and entrepreneur based in New York City. I'm the founder and CEO of Planetaria, where we develop technologies that empower regular people to explore space on their own terms.",
  alternates: {
    types: {
      'application/rss+xml': `${process.env.NEXT_PUBLIC_SITE_URL}/feed.xml`,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full">
        <Providers>
          <div className="fixed inset-0 -z-10">
            <Particles
              particleColors={['#fafafa', '#1d4ed8']}
              particleCount={200}
              particleSpread={10}
              speed={0.1}
              particleBaseSize={100}
              moveParticlesOnHover={true}
              alphaParticles={false}
              disableRotation={false}
              className="min-h-screen h-full bg-sky-600 dark:bg-zinc-950"
            />
          </div>
          <div className="flex w-full relative z-10">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
