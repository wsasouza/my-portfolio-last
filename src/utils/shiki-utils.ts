/**
 * Utilitários para trabalhar com o Shiki highlighter
 */

import { codeToHtml, bundledLanguages } from 'shiki';

const languageAliases: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'md': 'markdown',
  'yml': 'yaml',
  'sh': 'bash',
  'shell': 'bash',
  'zsh': 'bash',
  'console': 'bash',
  'terminal': 'bash',
  'cs': 'csharp',
  'razor': 'csharp',
  'html': 'html',
  'xml': 'xml',
  'svg': 'xml',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'json': 'json',
  'jsx': 'jsx',
  'tsx': 'tsx',
  'php': 'php',
  'go': 'go',
  'rust': 'rust',
  'c': 'c',
  'cpp': 'cpp',
  'java': 'java'
};

/**
 * Detecta a linguagem a partir de vários formatos possíveis
 * @param className Possível classe CSS no formato 'language-xxx'
 * @param language Nome direto da linguagem
 * @returns Nome normalizado da linguagem
 */
export function detectLanguage(className?: string, language?: string | null): string { 
  if (language) {    
    const cleanLang = language.toLowerCase().replace(/[`\s]/g, '');
    return languageAliases[cleanLang] || cleanLang;
  }  
  
  if (className) {
    const match = /language-(\w+)/.exec(className);
    if (match && match[1]) {
      const lang = match[1].toLowerCase();
      return languageAliases[lang] || lang;
    }
  }  
  
  if (className && className.includes('.')) {
    const ext = className.split('.').pop()?.toLowerCase();
    if (ext && languageAliases[ext]) {
      return languageAliases[ext];
    }
  }  
 
  return 'text';
}

/**
 * Realiza o destaque de sintaxe em um bloco de código usando Shiki
 * @param code Código a ser destacado
 * @param languageName Nome da linguagem
 * @returns Promise que resolve para HTML com o código destacado
 */
export async function highlightCodeWithShiki(code: string, languageName: string | undefined | null): Promise<string> {
  if (!code) return `<pre><code></code></pre>`;
  
  try {  
    let normalizedLang = detectLanguage(undefined, languageName) || 'text';
    
    let cleanCode = code;
    if (cleanCode.startsWith('```')) {      
      const lines = cleanCode.split('\n');
      if (lines[0].match(/^```\w+/)) {
        lines.shift();       
        if (lines[lines.length - 1].trim() === '```') {
          lines.pop();
        }
        cleanCode = lines.join('\n');
      }
    }    
   
    return await codeToHtml(cleanCode, {
      lang: normalizedLang,
      theme: 'dracula',
      transformers: [
        {
          pre(node) {            
            node.properties.className = ['shiki-highlighted', `language-${normalizedLang}`];
            return node;
          }
        }
      ]
    });
  } catch (error) {
    console.error('Erro ao destacar código com Shiki:', error);    
    return `<pre class="language-${languageName || 'text'}"><code>${escapeHtml(code)}</code></pre>`;
  }
}

/**
 * Escape HTML para segurança
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Prepara o código para highlight durante a renderização do cliente
 */
export function prepareCodeForClientHighlight(code: string, languageName: string | undefined | null): string {
  const normalizedLang = detectLanguage(undefined, languageName) || 'text';
  
  return `<pre class="shiki-pending" data-language="${normalizedLang}"><code class="language-${normalizedLang}">${escapeHtml(code)}</code></pre>`;
}
