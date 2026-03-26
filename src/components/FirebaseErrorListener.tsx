"use client";
'use client';
import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

export default function FirebaseErrorListener({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // This will be caught by the Next.js error overlay in development
      throw error;
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  return <>{children}</>;
}
