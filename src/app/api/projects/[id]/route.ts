import { NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase-admin';

// Handler para GET - Buscar um projeto pelo ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }
    
    const project = {
      id: projectDoc.id,
      ...projectDoc.data(),
    };
    
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar projeto' },
      { status: 500 }
    );
  }
}

// Handler para DELETE - Remover um projeto pelo ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const projectDoc = await db.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }
    
    const projectData = projectDoc.data();
    
    
    if (projectData?.logo && typeof projectData.logo === 'string' && projectData.logo.includes('firebasestorage.googleapis.com')) {
      try {
       
        const filePathMatch = projectData.logo.match(/\/projects\/[^/]+\/[^/]+$/);
        
        if (filePathMatch) {
          
          const filePath = filePathMatch[0].substring(1);
          const fileRef = storage.bucket().file(filePath);          
          const [exists] = await fileRef.exists();
          
          if (exists) {
            await fileRef.delete();
            console.log(`Logo do projeto excluído: ${filePath}`);
          }
        }
      } catch (fileError) {
        console.error('Erro ao excluir logo do projeto:', fileError);       
      }
    }    
   
    await db.collection('projects').doc(id).delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir projeto:', error);
    return NextResponse.json(
      { error: 'Falha ao excluir projeto' },
      { status: 500 }
    );
  }
} 
