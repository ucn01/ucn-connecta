import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';
import { FirebaseProvider, useFirebaseApp, useAuth, useFirestore, useFirebase } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useUser } from './auth/use-user';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';

const initializeFirebase = () => {
  if (getApps().length) {
    const app = getApp();
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    return { firebaseApp: app, firestore, auth };
  }
  const firebaseApp = initializeApp(firebaseConfig);
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  return { firebaseApp, firestore, auth };
};


export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useFirebaseApp,
  useAuth,
  useFirestore,
  useFirebase,
  useUser,
  useCollection,
  useDoc,
};
