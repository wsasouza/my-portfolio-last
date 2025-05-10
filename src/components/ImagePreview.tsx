'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImagePreviewProps {
  file: File | null;
  previewUrl: string | null;
  maxWidth?: number;
  maxHeight?: number;
}

export default function ImagePreview({ 
  file, 
  previewUrl, 
  maxWidth = 500, 
  maxHeight = 500 
}: ImagePreviewProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [willResize, setWillResize] = useState(false);
  const [originalSize, setOriginalSize] = useState<string | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) {
      setDimensions(null);
      setWillResize(false);
      setOriginalSize(null);
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;      
     
      const needsResize = originalWidth > maxWidth || originalHeight > maxHeight;
      setWillResize(needsResize);      
      
      let newWidth = originalWidth;
      let newHeight = originalHeight;
      
      if (needsResize) {
        const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
        newWidth = Math.floor(originalWidth * ratio);
        newHeight = Math.floor(originalHeight * ratio);
      }
      
      setDimensions({ width: newWidth, height: newHeight });
    };
    img.src = previewUrl;    
    
    if (file) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setOriginalSize(`${fileSizeMB} MB`);      
      
      const estimatedSizeMB = ((file.size * 0.2) / (1024 * 1024)).toFixed(2);
      setEstimatedSize(`~${estimatedSizeMB} MB`);
    }
    
    return () => {
      img.onload = null;
    };
  }, [previewUrl, file, maxWidth, maxHeight]);

  if (!previewUrl || !dimensions) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700">
      <div className="mb-4">
        <div className="relative w-full max-w-[300px] mx-auto">
          <Image
            src={previewUrl}
            alt="Prévia da imagem"
            width={300}
            height={300 * (dimensions.height / dimensions.width)}
            className="rounded-lg object-contain"
          />
          {willResize && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <div className="text-white text-center p-2">
                <p className="font-semibold">Será redimensionada para</p>
                <p>{dimensions.width} x {dimensions.height}px</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-zinc-400">
        <p className="mb-1">
          <span className="font-medium">Dimensões finais:</span> {dimensions.width} x {dimensions.height}px
        </p>
        {originalSize && (
          <p className="mb-1">
            <span className="font-medium">Tamanho original:</span> {originalSize}
          </p>
        )}
        {estimatedSize && willResize && (
          <p className="mb-1">
            <span className="font-medium">Tamanho estimado após processamento:</span> {estimatedSize}
          </p>
        )}
        {willResize && (
          <p className="text-yellow-600 dark:text-yellow-400 mt-2">
            Esta imagem será redimensionada e comprimida automaticamente.
          </p>
        )}
      </div>
    </div>
  );
} 
