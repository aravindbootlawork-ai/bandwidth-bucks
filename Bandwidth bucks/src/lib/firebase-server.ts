'use server';

import { firebaseConfig } from '@/firebase/config';

let _db: any = null;

/**
 * getServerFirestore
 * - If `FIREBASE_SERVICE_ACCOUNT` env var is provided (JSON), initialize firebase-admin
 *   and return admin.firestore(). This is the recommended production path on Netlify.
 * - Otherwise fall back to the client SDK server initializer (for local dev builds).
 */
export async function getServerFirestore() {
  if (_db) return _db;

  // Prefer firebase-admin when service account is available
  try {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.NETLIFY_FIREBASE_SERVICE_ACCOUNT;
    if (sa) {
      // Lazy-import firebase-admin to avoid bundling it into client code
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const admin = require('firebase-admin');
      if (!admin.apps || admin.apps.length === 0) {
        const cred = typeof sa === 'string' ? JSON.parse(sa) : sa;
        admin.initializeApp({ credential: admin.credential.cert(cred) });
      }
      _db = admin.firestore();
      return _db;
    }
  } catch (err) {
    console.warn('firebase-admin initialization failed, falling back to client SDK:', err);
  }

  // Fallback: use client SDK server initializer (keeps previous behavior)
  try {
    // Lazy-import client SDKs
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initializeApp, getApp, getApps } = require('firebase/app');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getFirestore } = require('firebase/firestore');
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    _db = getFirestore(app);
    return _db;
  } catch (error) {
    console.error('Failed to initialize Firebase client SDK on server:', error);
    throw error;
  }
}
