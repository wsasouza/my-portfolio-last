import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    // Esta rota é apenas para desenvolvimento e testes
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        error: 'Esta rota não está disponível em produção'
      }, { status: 403 });
    }
    
    const data = await request.json();
    const { bucketName } = data;
    
    if (!bucketName) {
      return NextResponse.json({
        success: false,
        error: 'Nome do bucket não especificado'
      }, { status: 400 });
    }
    
    // Criar um novo bucket
    const bucket = admin.storage().bucket(bucketName);
    const [exists] = await bucket.exists();
    
    if (exists) {
      return NextResponse.json({
        success: true,
        message: 'O bucket já existe',
        bucketName
      });
    }
    
    // Tentar criar o bucket
    try {
      await bucket.create();
      
      return NextResponse.json({
        success: true,
        message: 'Bucket criado com sucesso',
        bucketName
      });
    } catch (err: any) {
      return NextResponse.json({
        success: false,
        error: `Não foi possível criar o bucket: ${err.message}`,
        code: err.code
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro ao criar bucket:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 