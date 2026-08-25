import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { initFirebase, hasFirebaseCredentials } from './firebase.js';
import config from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const STORAGE_FILE = path.join(DATA_DIR, 'storage.json');

// Collection mapping to Firebase Firestore collection names
const FIRESTORE_COLLECTION_MAP = {
  users: 'users',
  students: 'students',
  admissions: 'admissions',
  careers: 'job_applications',
  reviews: 'reviews',
  nielitProjects: 'nielit_projects',
  events: 'event_rsvps',
  courses: 'courses',
  internships: 'internships',
  internshipApplications: 'internship_applications',
  certificates: 'certificates',
  fees: 'fees_payments',
  faculty: 'faculty_members',
  attendance: 'attendance_records',
  contacts: 'contacts',
  projects: 'projects'
};

// Memory cache of DB tables
let dbState = {
  users: [],
  students: [],
  admissions: [],
  careers: [],
  reviews: [],
  nielitProjects: [],
  events: [],
  courses: [],
  internships: [],
  internshipApplications: [],
  certificates: [],
  fees: [],
  faculty: [],
  attendance: [],
  contacts: [],
  projects: []
};

// Initialize persistent file store & Firebase
export function initDB() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORAGE_FILE)) {
      const content = fs.readFileSync(STORAGE_FILE, 'utf-8');
      dbState = { ...dbState, ...JSON.parse(content) };
    } else {
      saveDB();
    }
    console.log('✓ Local database storage adapter initialized successfully');
  } catch (err) {
    console.error('❌ Database storage initialization error:', err.message);
  }

  // Initialize Firebase Admin SDK
  initFirebase();
}

export function saveDB() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Failed to save database to storage file:', err.message);
  }
}

export const db = {
  getCollection(collectionName) {
    if (!dbState[collectionName]) {
      dbState[collectionName] = [];
    }
    return dbState[collectionName];
  },

  find(collectionName, queryFn = () => true) {
    const coll = this.getCollection(collectionName);
    return coll.filter(queryFn);
  },

  findOne(collectionName, queryFn) {
    const coll = this.getCollection(collectionName);
    return coll.find(queryFn) || null;
  },

  findById(collectionName, id) {
    return this.findOne(collectionName, item => item.id === id);
  },

  insert(collectionName, item) {
    const coll = this.getCollection(collectionName);
    const newItem = {
      id: item.id || uuidv4(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item
    };
    coll.unshift(newItem);
    saveDB();

    // Async Push to Firebase Firestore & Realtime DB
    try {
      const { firestoreDb, realtimeDb, isFirebaseInitialized } = initFirebase();
      const firestoreCollName = FIRESTORE_COLLECTION_MAP[collectionName] || collectionName;

      if (isFirebaseInitialized && hasFirebaseCredentials()) {
        if (firestoreDb) {
          firestoreDb.collection(firestoreCollName).doc(newItem.id).set(newItem)
            .then(() => console.log(`✓ Record saved to Firebase Firestore collection "${firestoreCollName}" ID: ${newItem.id}`))
            .catch(e => console.warn(`Firebase Firestore save notice (${firestoreCollName}):`, e.message));
        }

        if (realtimeDb) {
          realtimeDb.ref(`${firestoreCollName}/${newItem.id}`).set(newItem)
            .then(() => console.log(`✓ Record synced to Firebase Realtime DB "${firestoreCollName}" ID: ${newItem.id}`))
            .catch(e => console.warn(`Firebase Realtime DB sync notice:`, e.message));
        }
      } else if (config.firebaseDatabaseUrl) {
        // Fallback to Firebase Realtime DB REST API
        fetch(`${config.firebaseDatabaseUrl}/${firestoreCollName}/${newItem.id}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        }).then(async res => {
          if (res.ok) {
            console.log(`✓ Record synced to Firebase Realtime DB via REST "${firestoreCollName}" ID: ${newItem.id}`);
          }
        }).catch(() => {});
      }
    } catch (e) {
      // Graceful fallback
    }

    return newItem;
  },

  updateById(collectionName, id, updates) {
    const coll = this.getCollection(collectionName);
    const index = coll.findIndex(item => item.id === id);
    if (index === -1) return null;
    coll[index] = {
      ...coll[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveDB();

    // Async Update in Firebase
    try {
      const { firestoreDb, realtimeDb, isFirebaseInitialized } = initFirebase();
      const firestoreCollName = FIRESTORE_COLLECTION_MAP[collectionName] || collectionName;

      if (isFirebaseInitialized && hasFirebaseCredentials()) {
        if (firestoreDb) {
          firestoreDb.collection(firestoreCollName).doc(id).update({
            ...updates,
            updatedAt: new Date().toISOString()
          }).catch(e => console.warn(`Firebase Firestore update notice:`, e.message));
        }

        if (realtimeDb) {
          realtimeDb.ref(`${firestoreCollName}/${id}`).update({
            ...updates,
            updatedAt: new Date().toISOString()
          }).catch(e => console.warn(`Firebase Realtime DB update notice:`, e.message));
        }
      } else if (config.firebaseDatabaseUrl) {
        fetch(`${config.firebaseDatabaseUrl}/${firestoreCollName}/${id}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...updates, updatedAt: new Date().toISOString() })
        }).catch(() => {});
      }
    } catch (e) {}

    return coll[index];
  },

  deleteById(collectionName, id) {
    const coll = this.getCollection(collectionName);
    const index = coll.findIndex(item => item.id === id);
    if (index === -1) return false;
    coll.splice(index, 1);
    saveDB();

    // Async Delete in Firebase
    try {
      const { firestoreDb, realtimeDb, isFirebaseInitialized } = initFirebase();
      const firestoreCollName = FIRESTORE_COLLECTION_MAP[collectionName] || collectionName;

      if (isFirebaseInitialized && hasFirebaseCredentials()) {
        if (firestoreDb) {
          firestoreDb.collection(firestoreCollName).doc(id).delete()
            .catch(e => console.warn(`Firebase Firestore delete notice:`, e.message));
        }

        if (realtimeDb) {
          realtimeDb.ref(`${firestoreCollName}/${id}`).remove()
            .catch(e => console.warn(`Firebase Realtime DB delete notice:`, e.message));
        }
      } else if (config.firebaseDatabaseUrl) {
        fetch(`${config.firebaseDatabaseUrl}/${firestoreCollName}/${id}.json`, {
          method: 'DELETE'
        }).catch(() => {});
      }
    } catch (e) {}

    return true;
  },

  resetCollection(collectionName, data = []) {
    dbState[collectionName] = data;
    saveDB();
  }
};

export default db;
