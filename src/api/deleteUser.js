// src/api/deleteUser.js
const admin = require('firebase-admin');

// Inicializa la app de admin de Firebase si no se ha hecho antes
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { uid } = req.body; // UID del usuario a eliminar

  try {
    // 1. Eliminar de Firebase Authentication
    await admin.auth().deleteUser(uid);

    // 2. Eliminar de la colección 'users' en Firestore
    const userDocRef = admin.firestore().collection("users").doc(uid);
    await userDocRef.delete();

    return res.status(200).json({ status: 'success', message: `Usuario ${uid} eliminado.` });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({ error: error.message });
  }
}