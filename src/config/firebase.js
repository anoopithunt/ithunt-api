import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import config from './env.js';

let firebaseApp = null;
let firestoreDb = null;
let realtimeDb = null;
let firebaseStorage = null;
let isFirebaseInitialized = false;

export function initFirebase() {
  if (isFirebaseInitialized) {
    return { firebaseApp, firestoreDb, realtimeDb, firebaseStorage, isFirebaseInitialized };
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

    firebaseApp = app;
    firestoreDb = getFirestore(app);
    realtimeDb = getDatabase(app);
    try {
      firebaseStorage = getStorage(app);
    } catch (e) {
      // Storage optional
    }
    isFirebaseInitialized = true;
    console.log(`✓ Firebase Admin SDK connected to project: ${config.firebaseProjectId}`);
  } catch (err) {
    console.warn(`⚠️ Firebase Admin SDK initialization notice: ${err.message}`);
  }

  return { firebaseApp, firestoreDb, realtimeDb, firebaseStorage, isFirebaseInitialized };
}

export function hasFirebaseCredentials() {
  return Boolean(config.firebaseClientEmail && config.firebasePrivateKey);
}

function withTimeout(promise, ms = 1500) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase request timed out (offline or missing credentials)')), ms))
  ]);
}

/**
 * Fetch all documents in a Firestore collection
 */
export async function fetchCollectionFromFirestore(collectionName) {
  const { firestoreDb } = initFirebase();
  if (!firestoreDb || !hasFirebaseCredentials()) {
    throw new Error('Firestore is not configured with service account credentials');
  }

  const snapshot = await withTimeout(firestoreDb.collection(collectionName).get(), 2000);
  if (!snapshot || snapshot.empty) {
    return [];
  }

  const records = [];
  snapshot.forEach(doc => {
    records.push({ id: doc.id, ...doc.data() });
  });
  return records;
}

/**
 * Fetch a single document from a Firestore collection by ID
 */
export async function fetchDocumentFromFirestore(collectionName, docId) {
  const { firestoreDb } = initFirebase();
  if (!firestoreDb || !hasFirebaseCredentials()) {
    throw new Error('Firestore is not configured with service account credentials');
  }

  const doc = await withTimeout(firestoreDb.collection(collectionName).doc(docId).get(), 2000);
  if (!doc || !doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
}

/**
 * Fetch data from Firebase Realtime Database
 */
export async function fetchFromRealtimeDB(path = '') {
  const { realtimeDb } = initFirebase();
  if (!realtimeDb || !hasFirebaseCredentials()) {
    throw new Error('Realtime Database is not configured with credentials');
  }

  const snapshot = await withTimeout(realtimeDb.ref(path).once('value'), 2000);
  return snapshot ? snapshot.val() : null;
}

/**
 * List files from Firebase Cloud Storage Bucket
 */
export async function fetchFilesFromStorage(prefix = '') {
  const { firebaseStorage } = initFirebase();
  if (!firebaseStorage || !hasFirebaseCredentials()) {
    throw new Error('Firebase Cloud Storage is not configured with credentials');
  }

  const bucket = firebaseStorage.bucket();
  const [files] = await withTimeout(bucket.getFiles({ prefix }), 2000);

  return (files || []).map(f => ({
    name: f.name,
    size: f.metadata ? f.metadata.size : 0,
    contentType: f.metadata ? f.metadata.contentType : '',
    updated: f.metadata ? f.metadata.updated : '',
    publicUrl: `https://storage.googleapis.com/${bucket.name}/${f.name}`
  }));
}

export { firebaseApp, firestoreDb, realtimeDb, firebaseStorage, isFirebaseInitialized };
export default initFirebase;
