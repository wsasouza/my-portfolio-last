'use client';

import NextImage, { ImageProps as NextImageProps } from 'next/image';
import { useState } from 'react';
import clsx from 'clsx';

interface ImageProps extends NextImageProps {
  caption?: string;
}

export function Image({ 
  src, 
  alt = '', 
  caption, 
  className, 
  ...props 
}: ImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <figure className="my-8">
      <div className={clsx(
        'overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800',
        isLoading ? 'animate-pulse' : '',
        className
      )}>
        <NextImage 
          src={src} 
          alt={alt} 
          className={clsx(
            'duration-700 ease-in-out',
            isLoading ? 'scale-110 blur-sm' : 'scale-100 blur-0'
          )}
          onLoad={() => setIsLoading(false)}
          quality={90}
          sizes="(min-width: 1280px) 36rem, (min-width: 1024px) 45vw, (min-width: 640px) 32rem, 95vw"
          {...props}
        />
      </div>
      {caption && (
        <figcaption className="mt-4 text-sm text-center text-zinc-500 dark:text-zinc-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
} 
