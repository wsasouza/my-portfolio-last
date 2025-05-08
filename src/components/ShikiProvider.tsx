'use client';

import { useEffect } from 'react';

interface ShikiProviderProps {
  children: React.ReactNode;
}

export default function ShikiProvider({ children }: ShikiProviderProps) {  
  useEffect(() => {   
    import('shiki/langs/typescript.mjs');
    import('shiki/langs/javascript.mjs');
    import('shiki/langs/css.mjs');
    import('shiki/langs/html.mjs');
    import('shiki/langs/json.mjs');
    import('shiki/langs/markdown.mjs');    
   
    import('shiki/themes/github-dark.mjs');    
    
  }, []);

  return <>{children}</>;
} 
