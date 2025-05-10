import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Obter informações sobre a configuração do Firebase
    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      isInitialized: admin.apps.length > 0,
    };
    
    // Obter informações sobre o bucket
    const bucket = storage.bucket();
    const bucketName = bucket.name;
    
    // Tentar obter metadados do bucket
    let bucketMetadata = null;
    let bucketExists = false;
    let error = null;
    
    try {
      [bucketMetadata] = await bucket.getMetadata();
      bucketExists = true;
    } catch (err: any) {
      error = {
        message: err.message,
        code: err.code,
      };
    }
    
    // Verificar se o bucket padrão existe
    const defaultBucketName = `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
    let defaultBucketExists = false;
    
    if (bucketName !== defaultBucketName) {
      try {
        const defaultBucket = storage.bucket(defaultBucketName);
        const [exists] = await defaultBucket.exists();
        defaultBucketExists = exists;
      } catch (err) {
        // Ignorar erros ao verificar o bucket padrão
      }
    }
    
    return NextResponse.json({
      success: true,
      firebaseConfig,
      bucket: {
        name: bucketName,
        exists: bucketExists,
        metadata: bucketMetadata,
        error,
      },
      defaultBucket: {
        name: defaultBucketName,
        exists: defaultBucketExists,
        isCurrent: bucketName === defaultBucketName,
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter informações do bucket:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 