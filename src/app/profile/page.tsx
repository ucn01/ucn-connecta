"use client";
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/my-profile');
  }, [router]);
  
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
