import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Artigos',
  description:
    'Reflexões sobre desenvolvimento, tecnologia, carreira e aprendizados da prática.',
};

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 
