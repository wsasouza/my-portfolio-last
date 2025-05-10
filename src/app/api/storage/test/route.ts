import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Verificar se o Firebase Admin está inicializado
    const isInitialized = admin.apps.length > 0;
    
    // Verificar se conseguimos acessar o bucket do Storage
    const bucket = storage.bucket();
    const [exists] = await bucket.exists();
    
    // Verificar se conseguimos listar arquivos
    const [files] = await bucket.getFiles({ maxResults: 5 });
    
    return NextResponse.json({
      success: true,
      isInitialized,
      bucketExists: exists,
      bucketName: bucket.name,
      sampleFiles: files.slice(0, 5).map(file => ({
        name: file.name,
        contentType: file.metadata.contentType,
        size: file.metadata.size,
      }))
    });
  } catch (error: any) {
    console.error('Erro ao testar Firebase Storage:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 