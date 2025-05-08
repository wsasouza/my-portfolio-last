import Image, { type ImageProps } from 'next/image'
import { type MDXComponents } from 'mdx/types'
import { Code } from '@/components/Code'
import { CodeBlock } from '@/components/CodeBlock'

export function useMDXComponents(components: MDXComponents) {
  return {
    ...components,
    Image: ({ alt = '', ...props }: ImageProps) => <Image alt={alt} {...props} />,
    code: (props: any) => <Code {...props} />,
    pre: (props: any) => <CodeBlock {...props} />
  }
}
