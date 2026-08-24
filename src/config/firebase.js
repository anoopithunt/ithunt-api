import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import config from './env.js';

let firestoreDb = null;
let realtimeDb = null;
let isFirebaseInitialized = false;

export function initFirebase() {
  if (isFirebaseInitialized) {
    return { firestoreDb, realtimeDb, isFirebaseInitialized };
  }

  try {
    const existingApps = getApps();
    let app;

    if (existingApps.length === 0) {
      const adminConfig = {
        projectId: config.firebaseProjectId,
        databaseURL: config.firebaseDatabaseUrl
      };

      if (config.firebaseClientEmail && config.firebasePrivateKey) {
        adminConfig.credential = cert({
          projectId: config.firebaseProjectId,
          clientEmail: config.firebaseClientEmail,
          privateKey: config.firebasePrivateKey
        });
      }

      app = initializeApp(adminConfig);
    } else {
      app = existingApps[0];
    }

    firestoreDb = getFirestore(app);
    realtimeDb = getDatabase(app);
    isFirebaseInitialized = true;
    console.log(`✓ Firebase Admin SDK connected to project: ${config.firebaseProjectId}`);
  } catch (err) {
    console.warn(`⚠️ Firebase Admin SDK initialization notice: ${err.message}`);
  }

  return { firestoreDb, realtimeDb, isFirebaseInitialized };
}

export { firestoreDb, realtimeDb, isFirebaseInitialized };
export default initFirebase;
