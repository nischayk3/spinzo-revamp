import * as admin from 'firebase-admin';
import { credential } from 'firebase-admin';
import * as path from 'path';
import * as dotenvFlow from 'dotenv-flow';

dotenvFlow.config({ silent: true });

// Initialize Firebase Admin SDK once
// Ensure FIREBASE_SERVICE_ACCOUNT_PATH is set in .env.development or Railway secrets
if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  console.log(`[Firebase Admin Config] serviceAccountPath from ENV: ${serviceAccountPath}`);

  if (!serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set.');
  }
  try {
    const absoluteServiceAccountPath = path.resolve(process.cwd(), serviceAccountPath);
    console.log(`[Firebase Admin Config] Resolved absolute path: ${absoluteServiceAccountPath}`);

    const serviceAccount = require(absoluteServiceAccountPath);
    console.log(`[Firebase Admin Config] Service account file loaded successfully. Project ID: ${serviceAccount.project_id}`);

    admin.initializeApp({
      credential: credential.cert(serviceAccount),
    });
    console.log('[Firebase Admin Config] Firebase Admin SDK initialized successfully.');

  } catch (error: unknown) {
    console.error('[Firebase Admin Config] Error initializing Firebase Admin SDK:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to initialize Firebase Admin SDK. Check service account path and file: ${errorMessage}`);
  }
}

export const firebaseAdminApp = admin.app();