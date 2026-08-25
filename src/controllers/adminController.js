import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/helpers.js';
import {
  fetchCollectionFromFirestore,
  fetchDocumentFromFirestore,
  fetchFromRealtimeDB,
  fetchFilesFromStorage,
  firestoreDb,
  initFirebase,
  hasFirebaseCredentials
} from '../config/firebase.js';

export function getDashboardStats(req, res) {
  const admissions = db.getCollection('admissions');
  const careers = db.getCollection('careers');
  const reviews = db.getCollection('reviews');
  const users = db.getCollection('users');
  const students = db.getCollection('students');
  const nielit = db.getCollection('nielitProjects');
  const events = db.getCollection('events');

  const stats = {
    totalAdmissions: admissions.length,
    provisionallyAdmitted: admissions.filter(a => a.status === 'PROVISIONALLY ADMITTED').length,
    pendingJobApplications: careers.filter(c => c.status === 'PENDING_REVIEW').length,
    totalJobApplications: careers.length,
    totalRegisteredStudents: students.length || users.filter(u => u.role === 'student').length,
    totalReviews: reviews.length,
    verifiedReviews: reviews.filter(r => r.verified).length,
    nielitProjectsSubmitted: nielit.length,
    eventRsvpsConfirmed: events.filter(e => e.status === 'CONFIRMED').length,
    systemStatus: 'ONLINE_ACTIVE'
  };

  return successResponse(res, 'SuperAdmin dashboard executive statistics generated', { stats });
}

/**
 * Fetch detail collection directly from Firebase Firestore / local fallback
 */
export async function getFirebaseCollectionData(req, res) {
  try {
    const { collection } = req.params;

    if (!collection) {
      return errorResponse(res, 'Collection name parameter is required', 400);
    }

    let records = [];
    let source = 'firebase_firestore';

    try {
      if (firestoreDb) {
        records = await fetchCollectionFromFirestore(collection);
      } else {
        throw new Error('Firestore not initialized');
      }
    } catch (firestoreErr) {
      // Graceful fallback to local adapter collection
      source = 'local_storage_cache';
      records = db.getCollection(collection);
    }

    return successResponse(res, `Collection "${collection}" fetched successfully from ${source}`, {
      collection,
      source,
      count: records.length,
      data: records
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Fetch a single document detail from Firebase Firestore
 */
export async function getFirebaseDocumentData(req, res) {
  try {
    const { collection, id } = req.params;

    let document = null;
    let source = 'firebase_firestore';

    try {
      if (firestoreDb) {
        document = await fetchDocumentFromFirestore(collection, id);
      } else {
        throw new Error('Firestore not initialized');
      }
    } catch (firestoreErr) {
      source = 'local_storage_cache';
      document = db.findById(collection, id);
    }

    if (!document) {
      return errorResponse(res, `Document "${id}" not found in collection "${collection}"`, 404);
    }

    return successResponse(res, `Document fetched successfully from ${source}`, {
      collection,
      id,
      source,
      data: document
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Fetch file metadata list from Firebase Cloud Storage
 */
export async function getFirebaseStorageFiles(req, res) {
  try {
    const { prefix } = req.query;

    try {
      const files = await fetchFilesFromStorage(prefix || '');
      return successResponse(res, 'Firebase Storage files retrieved successfully', {
        files,
        totalCount: files.length
      });
    } catch (storageErr) {
      return successResponse(res, 'Firebase Storage bucket connection status', {
        files: [],
        totalCount: 0,
        notice: storageErr.message
      });
    }
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Fetch and sync data from Firebase Realtime DB
 */
export async function getRealtimeDBData(req, res) {
  try {
    const path = req.query.path || '';
    const data = await fetchFromRealtimeDB(path);
    return successResponse(res, `Firebase Realtime DB data for path "${path}" fetched successfully`, {
      path,
      data
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Diagnostic status of Firebase Connection & Credentials
 */
export function getFirebaseStatus(req, res) {
  const { isFirebaseInitialized } = initFirebase();
  const hasCreds = hasFirebaseCredentials();

  return successResponse(res, 'Firebase Connection & Credentials Diagnostic Status', {
    projectId: 'ithunt-3a42d',
    databaseUrl: 'https://ithunt-3a42d-default-rtdb.firebaseio.com',
    isFirebaseInitialized,
    hasServiceAccountCredentials: hasCreds,
    realtimeDbUrl: 'https://console.firebase.google.com/project/ithunt-3a42d/database/ithunt-3a42d-default-rtdb/data',
    helpMessage: hasCreds
      ? 'Firebase Admin SDK is fully authenticated with Service Account credentials.'
      : 'Firebase Service Account credentials are not set in .env. To enable real-time writes, add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env OR enable ".read": true, ".write": true in Firebase Console Realtime Database rules.'
  });
}

/**
 * Push all local collections to Firebase Realtime DB & Firestore
 */
export async function pushAllDataToFirebase(req, res) {
  try {
    const collections = [
      'users',
      'students',
      'admissions',
      'reviews',
      'courses',
      'internships',
      'certificates',
      'fees',
      'faculty',
      'attendance',
      'contacts',
      'nielitProjects',
      'events',
      'careers'
    ];

    const results = {};
    const { realtimeDb, firestoreDb, isFirebaseInitialized } = initFirebase();
    const hasCreds = hasFirebaseCredentials();

    for (const collName of collections) {
      const items = db.getCollection(collName);
      let syncedCount = 0;

      for (const item of items) {
        if (isFirebaseInitialized && hasCreds) {
          if (realtimeDb) {
            await realtimeDb.ref(`${collName}/${item.id}`).set(item).catch(() => {});
          }
          if (firestoreDb) {
            await firestoreDb.collection(collName).doc(item.id).set(item).catch(() => {});
          }
          syncedCount++;
        } else {
          // Attempt REST API push to Realtime Database
          try {
            const resp = await fetch(`https://ithunt-3a42d-default-rtdb.firebaseio.com/${collName}/${item.id}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item)
            });
            if (resp.ok) syncedCount++;
          } catch (e) {}
        }
      }

      results[collName] = { total: items.length, syncedToFirebase: syncedCount };
    }

    return successResponse(res, 'Full Firebase Data Sync Operation Completed', {
      hasServiceAccountCredentials: hasCreds,
      syncSummary: results,
      realtimeConsoleUrl: 'https://console.firebase.google.com/project/ithunt-3a42d/database/ithunt-3a42d-default-rtdb/data'
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

