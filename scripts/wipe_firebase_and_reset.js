import { initFirebase } from '../src/config/firebase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const STORAGE_FILE = path.join(DATA_DIR, 'storage.json');

const COLLECTIONS_TO_WIPE = [
  'users',
  'students',
  'admissions',
  'careers',
  'job_applications',
  'reviews',
  'nielitProjects',
  'nielit_projects',
  'events',
  'event_rsvps',
  'courses',
  'internships',
  'internshipApplications',
  'internship_applications',
  'certificates',
  'fees',
  'fees_payments',
  'faculty',
  'faculty_members',
  'attendance',
  'attendance_records',
  'contacts',
  'projects',
  'system_health'
];

async function wipeAllFirebaseAndReset() {
  console.log('\n===============================================================');
  console.log('🚨 STARTING COMPLETE FIREBASE & LOCAL DATABASE RESET');
  console.log('===============================================================\n');

  const { firestoreDb, realtimeDb, isFirebaseInitialized } = initFirebase();

  // 1. Wipe Firebase Realtime Database
  if (realtimeDb) {
    try {
      console.log('⏳ Clearing Firebase Realtime Database root node...');
      await realtimeDb.ref().remove();
      console.log('✓ Firebase Realtime Database wiped clean (100% fresh).');
    } catch (err) {
      console.error('⚠️ Realtime DB wipe notice:', err.message);
    }
  }

  // 2. Wipe Firebase Firestore Collections
  if (firestoreDb) {
    console.log('⏳ Clearing Firebase Firestore collections...');
    for (const collName of COLLECTIONS_TO_WIPE) {
      try {
        const snapshot = await firestoreDb.collection(collName).get();
        if (snapshot.size > 0) {
          const batch = firestoreDb.batch();
          snapshot.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          console.log(`✓ Deleted ${snapshot.size} documents from Firestore "${collName}"`);
        }
      } catch (err) {
        // Collection might be empty or not created yet
      }
    }
    console.log('✓ Firebase Firestore collections wiped clean.');
  }

  // 3. Reset Local Storage & Create Fresh SuperAdmin
  console.log('⏳ Resetting local storage.json with fresh SuperAdmin...');
  const hashedPassword = await bcrypt.hash('admin@ithunt2026', 10);
  const superAdminUser = {
    id: 'admin-001',
    name: 'Lakshman Singh Chauhan',
    email: 'admin@ithunt.com',
    password: hashedPassword,
    role: 'superadmin',
    designation: 'Director & Founder',
    phone: '+919795771806',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const freshState = {
    users: [superAdminUser],
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

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(freshState, null, 2), 'utf-8');

  // Push fresh SuperAdmin to Firebase
  if (firestoreDb) {
    const { password: _, ...safeAdmin } = superAdminUser;
    await firestoreDb.collection('users').doc(superAdminUser.id).set(safeAdmin).catch(() => {});
  }
  if (realtimeDb) {
    const { password: _, ...safeAdmin } = superAdminUser;
    await realtimeDb.ref(`users/${superAdminUser.id}`).set(safeAdmin).catch(() => {});
  }

  console.log('\n===============================================================');
  console.log('🎉 ALL DATABASE DATA HAS BEEN WIPED AND RESET AS NEW!');
  console.log('🔑 Fresh SuperAdmin Account Ready: admin@ithunt.com / admin@ithunt2026');
  console.log('===============================================================\n');
}

wipeAllFirebaseAndReset().catch(console.error);
