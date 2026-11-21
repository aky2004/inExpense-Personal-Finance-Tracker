import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;

const apps = getApps();

let firebaseAdminApp: App;

if (apps.length > 0) {
  firebaseAdminApp = apps[0]!;
} else if (projectId && clientEmail && privateKey) {
  firebaseAdminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });
} else {
  console.warn(
    '[FirebaseAdmin] Warning: Firebase Admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) not fully configured in environment. Google token verification may fail.'
  );
  firebaseAdminApp = initializeApp({
    projectId: projectId || 'inexpense-placeholder',
  });
}

export { firebaseAdminApp };
export const firebaseAdminAuth = getAuth(firebaseAdminApp);
