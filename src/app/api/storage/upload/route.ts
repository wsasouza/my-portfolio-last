import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    console.log('Iniciando upload de arquivo...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    
    console.log('Arquivo recebido:', file ? {
      name: file.name,
      type: file.type,
      size: file.size
    } : 'nenhum arquivo');
    console.log('Pasta de destino:', folder);
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }
    
    // Converter o arquivo para buffer
    console.log('Convertendo arquivo para buffer...');
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let processedBuffer: Buffer;
    let contentType = file.type;
    
    // Verificar se é uma imagem
    if (file.type.startsWith('image/')) {
      console.log('Processando imagem com sharp...');
      try {
        // Processar a imagem com sharp
        const image = sharp(fileBuffer);
        const metadata = await image.metadata();
        console.log('Metadata da imagem:', metadata);
        
        // Redimensionar apenas se a imagem for maior que 500x500
        if ((metadata.width && metadata.width > 500) || (metadata.height && metadata.height > 500)) {
          console.log('Redimensionando imagem grande...');
          processedBuffer = await image
            .resize({
              width: 500,
              height: 500,
              fit: 'inside', // Mantém a proporção da imagem
              withoutEnlargement: true // Não amplia imagens menores
            })
            .jpeg({ quality: 80 }) // Compressão de qualidade para JPEGs
            .toBuffer();
          
          contentType = 'image/jpeg';
        } else {
          console.log('Comprimindo imagem pequena...');
          // Se a imagem já é pequena, apenas comprimir
          processedBuffer = await image
            .jpeg({ quality: 80 })
            .toBuffer();
          
          contentType = 'image/jpeg';
        }
      } catch (sharpError) {
        console.error('Erro ao processar imagem com sharp:', sharpError);
        // Se falhar o processamento com sharp, usar o buffer original
        processedBuffer = fileBuffer;
      }
    } else {
      console.log('Arquivo não é uma imagem, usando buffer original');
      // Se não for uma imagem, manter o buffer original
      processedBuffer = fileBuffer;
    }
    
    const uniqueFileName = `${uuidv4()}-${file.name.replace(/\.[^/.]+$/, "")}.jpg`;
    const filePath = `${folder}/${uniqueFileName}`;
    console.log('Caminho do arquivo no Firebase Storage:', filePath);
    
    const fileRef = storage.bucket().file(filePath);
    
    console.log('Salvando arquivo no Firebase Storage...');
    await fileRef.save(processedBuffer, {
      metadata: {
        contentType: contentType,
      },
    });
    
    console.log('Gerando URL direto do Firebase Storage...');
    // Gerar URL no formato direto do Firebase Storage
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const bucketName = storage.bucket().name;
    
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID não está definido');
    }
    
    // URL no formato direto do Firebase Storage
    const encodedFilePath = encodeURIComponent(filePath);
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedFilePath}?alt=media`;
    
    console.log('Upload concluído com sucesso. URL:', url);
    return NextResponse.json({ 
      success: true, 
      url,
      path: filePath
    });
  } catch (error: any) {
    console.error('Erro ao fazer upload de arquivo:', error);
    console.error('Detalhes do erro:', error.message);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { error: `Falha ao fazer upload de arquivo: ${error.message}` },
      { status: 500 }
    );
  }
} 