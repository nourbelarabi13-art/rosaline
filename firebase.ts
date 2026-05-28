import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let db: any = null;
let auth: any = null;
let isFirebaseAvailable = false;

const isPlaceholder = !firebaseConfig || 
                      !firebaseConfig.apiKey || 
                      firebaseConfig.apiKey.includes('remixed-') || 
                      firebaseConfig.apiKey.includes('MY_') ||
                      firebaseConfig.apiKey === '';

if (firebaseConfig && firebaseConfig.apiKey && !isPlaceholder) {
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || undefined);
    auth = getAuth(app);
    isFirebaseAvailable = true;

    // Validate connection to Firestore as required by the instruction
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  } catch (e) {
    console.error("Failed to initialize Firebase with provided credentials:", e);
  }
} else {
  console.log("Firebase is operating in offline local-fallback mode due to placeholder or missing credentials.");
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((p: any) => ({
        providerId: p.providerId,
        email: p.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { db, auth, isFirebaseAvailable, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider };
export const googleProvider = new GoogleAuthProvider();
