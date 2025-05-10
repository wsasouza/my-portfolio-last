import admin from 'firebase-admin';


if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID não está definido');
    }       
    
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
      console.warn('FIREBASE_STORAGE_BUCKET não está definido. Usando bucket padrão.');
    }    
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: storageBucket || `gs://${projectId}.appspot.com`,
    });       
    
  } catch (err) {
    const error = err as Error;
    console.error(`Erro na inicialização do Firebase Admin: ${error.message}`);
    throw new Error(`Falha ao inicializar Firebase Admin: ${error.message}`);
  }
}

export const db = admin.firestore();
export const storage = admin.storage();

export default admin; 
