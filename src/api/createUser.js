// src/api/createUser.js
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

  const { email, password, username, role, storeId } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { role, storeId });

    const userDocRef = admin.firestore().collection("users").doc(userRecord.uid);
    await userDocRef.set({
      username,
      email,
      role,
      storeId,
    });

    return res.status(200).json({ status: 'success', userId: userRecord.uid });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ error: error.message });
  }
}