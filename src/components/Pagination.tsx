'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

export function Pagination({ currentPage, totalPages, baseUrl = '' }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('pagina', pageNumber.toString());
    return `${baseUrl || pathname}?${params.toString()}`;
  };
  
  const goToPage = (pageNumber: number) => {
    router.push(createPageURL(pageNumber));
  };
  
  // Não renderizar a paginação se tivermos apenas uma página
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <Button
        variant="secondary"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Anterior
      </Button>
      
      <div className="flex gap-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          // Lógica para exibir no máximo 5 páginas, centradas na página atual
          let pageNumber;
          
          if (totalPages <= 5) {
            // Se tivermos 5 ou menos páginas, mostrar todas
            pageNumber = i + 1;
          } else if (currentPage <= 3) {
            // Se estamos nas primeiras páginas, mostrar 1-5
            pageNumber = i + 1;
          } else if (currentPage >= totalPages - 2) {
            // Se estamos nas últimas páginas, mostrar as últimas 5
            pageNumber = totalPages - 4 + i;
          } else {
            // No meio, centrar na página atual
            pageNumber = currentPage - 2 + i;
          }
          
          return (
            <Button
              key={pageNumber}
              variant={currentPage === pageNumber ? 'primary' : 'secondary'}
              onClick={() => goToPage(pageNumber)}
            >
              {pageNumber}
            </Button>
          );
        })}
      </div>
      
      <Button
        variant="secondary"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Próxima
      </Button>
    </div>
  );
} 
