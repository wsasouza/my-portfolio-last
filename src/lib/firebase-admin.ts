import admin from 'firebase-admin';

// Verificar se já existe uma instância do Firebase Admin
if (!admin.apps.length) {
  try {
    const config = {
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      // Usar o bucket padrão do projeto
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    };
    
    admin.initializeApp(config);
  } catch (err) {
    const error = err as Error;
    throw new Error(`Falha ao inicializar Firebase Admin: ${error.message}`);
  }
}

// Inicializar Firestore
export const db = admin.firestore();

// Inicializar Storage Bucket
export const storage = admin.storage().bucket();

export default admin; 