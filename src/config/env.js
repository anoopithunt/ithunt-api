import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET || 'ithunt_secret_key_2026_fallback',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mongodbUri: process.env.MONGODB_URI || '',
  
  // Firebase Cloud Configuration
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'ithunt-3a42d',
  firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL || 'https://ithunt-3a42d-default-rtdb.firebaseio.com',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  firebasePrivateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),

  // Organization Meta Information
  orgName: process.env.ORGANIZATION_NAME || 'IT HUNT',
  orgLead: process.env.ORGANIZATION_LEAD || 'Mr. Lakshman Singh Chauhan',
  orgEmail: process.env.ORGANIZATION_EMAIL || 'softtechithunt@gmail.com',
  orgPhone: process.env.ORGANIZATION_PHONE || '+91 9795771806',
  orgLocation: process.env.ORGANIZATION_LOCATION || '📍 Dahiyawa Holagarh, Prayagraj (Allahabad), UP'
};

export default config;
