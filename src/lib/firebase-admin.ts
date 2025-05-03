import admin from 'firebase-admin';


if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID não está definido');
    }    
   
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });    
    
  } catch (err) {
    const error = err as Error;
    console.error(`Erro na inicialização do Firebase Admin: ${error.message}`);
    throw new Error(`Falha ao inicializar Firebase Admin: ${error.message}`);
  }
}

export const db = admin.firestore();

export default admin; 
