'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase/provider';
import { type User as AuthUser } from 'firebase/auth';
import { type User } from '@/lib/types';

export const useUser = () => {
  const auth = useAuth();
  const firestore = useFirestore();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (!user) { // If no authenticated user, we're done loading.
          setUser(null);
          setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (authUser && firestore) {
      const userRef = doc(firestore, 'users', authUser.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          setUser({ uid: doc.id, ...doc.data() } as User);
        } else {
          setUser(null);
        }
        setLoading(false); // Loading is false only after we get firestore doc.
      });
      return () => unsubscribe();
    }
  }, [authUser, firestore]);

  return { user, authUser, loading };
};
