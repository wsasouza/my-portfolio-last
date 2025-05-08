import clsx from 'clsx'

export function Prose({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={clsx(
      className, 
      'prose dark:prose-invert max-w-none',
      'prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline',
      'prose-headings:scroll-mt-28'
    )} {...props} />
  )
}
