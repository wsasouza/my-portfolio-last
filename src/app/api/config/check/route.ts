import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar as variáveis de ambiente necessárias para o Firebase
    const envVars = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_STORAGE_BUCKET: !!process.env.FIREBASE_STORAGE_BUCKET,
      // Não expomos os valores reais, apenas se estão definidos
    };
    
    // Verificar se todas as variáveis necessárias estão definidas
    const allVarsPresent = Object.values(envVars).every(Boolean);
    
    return NextResponse.json({
      success: true,
      envVars,
      allVarsPresent,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error: any) {
    console.error('Erro ao verificar configuração:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
} 