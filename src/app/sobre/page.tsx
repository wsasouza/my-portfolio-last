import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'

import { Container } from '@/components/Container'
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  WhatsAppIcon,
  XIcon,
} from '@/components/SocialIcons'
import portraitImage from '@/images/portrait.png'
import { info } from '@/utils/info'

function SocialLink({
  className,
  href,
  children,
  icon: Icon,
}: {
  className?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <li className={clsx(className, 'flex')}>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex text-sm font-medium text-zinc-800 transition hover:text-blue-500 dark:text-zinc-200 dark:hover:text-blue-500"
      >
        <Icon className="h-6 w-6 flex-none fill-zinc-500 transition group-hover:fill-blue-500" />
        <span className="ml-4">{children}</span>
      </Link>
    </li>
  )
}

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M6 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6Zm.245 2.187a.75.75 0 0 0-.99 1.126l6.25 5.5a.75.75 0 0 0 .99 0l6.25-5.5a.75.75 0 0 0-.99-1.126L12 12.251 6.245 7.187Z"
      />
    </svg>
  )
}

export const metadata: Metadata = {
  title: 'Sobre',
  description:
    'Olá, meu nome é Walter e desenvolvo aplicações web modernas que conectam propósito e tecnologia.',
}

export default function About() {
  return (
    <Container className="mt-16 sm:mt-32">
      <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-12">
        <div className="lg:pl-20">
          <div className="max-w-xs px-2.5 lg:max-w-none">
            <Image
              src={portraitImage}
              alt=""
              sizes="(min-width: 1024px) 32rem, 20rem"
              className="aspect-square rotate-3 rounded-2xl bg-zinc-100 object-cover dark:bg-zinc-800"
            />
          </div>
        </div>
        <div className="lg:order-first lg:row-span-2">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
          Olá, meu nome é Walter e desenvolvo aplicações web modernas que conectam propósito e tecnologia.
          </h1>
          <div className="mt-6 space-y-7 text-base text-zinc-600 dark:text-zinc-400">
            <p>
            Sou Walter Souza, desenvolvedor full-stack e criador da Up Web Studio, minha marca pessoal para atuar como freelancer em projetos digitais. Depois de anos trabalhando com eletrônica e gestão, encontrei na programação uma forma de unir minha paixão por tecnologia com a criação de soluções úteis e bem projetadas.
            </p>
            <p>
            Atuo no desenvolvimento de aplicações web modernas utilizando tecnologias como React, Typescript, Next.js, TailwindCSS, Node.js e bancos de dados relacionais e não-relacionais. Tenho experiência com plataformas como Hygraph, Firebase, Supabase, além de integração com serviços em nuvem e APIs.
            </p>
            <p>
            Através da Up Web Studio, ajudo startups e empresas a tirarem suas ideias do papel com rapidez e clareza, transformando conceitos em MVPs funcionais, escaláveis e bem estruturados. Ao mesmo tempo, colaboro com empresas locais que buscam se posicionar no ambiente digital, desenvolvendo sites, sistemas e soluções personalizadas que fortalecem sua presença online e impulsionam seus resultados.
            </p>
            <p>
            Além dos projetos independentes, estou aberto a integrar times da empresa contratante como um colaborador de grande valia — contribuindo com comprometimento, visão técnica e espírito de equipe.
            </p>
          </div>
        </div>
        <div className="lg:pl-20">
          <ul role="list">
            
            <SocialLink href={info.instagram} icon={InstagramIcon} className="mt-4">
              Me siga no Instagram
            </SocialLink>
            <SocialLink href={info.github} icon={GitHubIcon} className="mt-4">
              Acesse meu GitHub
            </SocialLink>
            <SocialLink href={info.linkedin} icon={LinkedInIcon} className="mt-4">
              Me siga no LinkedIn
            </SocialLink>
            <SocialLink href={info.whatsapp} icon={WhatsAppIcon} className="mt-4">
              Fale comigo no WhatsApp
            </SocialLink>
            <SocialLink
              href={info.emailLink}
              icon={MailIcon}
              className="mt-8 border-t border-zinc-100 pt-8 dark:border-zinc-700/40"
            >
              {info.email}
            </SocialLink>
          </ul>
        </div>
      </div>
    </Container>
  )
}
