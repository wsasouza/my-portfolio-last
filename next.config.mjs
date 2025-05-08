import nextMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  experimental: {
    outputFileTracingIncludes: {
      '/articles/*': ['./src/app/articles/**/*.mdx'],
    },
  },
  images: {
    dangerouslyAllowSVG: true,
    domains: ['storage.googleapis.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
        pathname: '/**',
      }
    ],
  },
  webpack: (config) => {
    // Habilitar WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // Configurar regra para arquivos .wasm
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    
    return config;
  },
}

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
})

export default withMDX(nextConfig)
