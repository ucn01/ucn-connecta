"use client";
'use client';

import { useMemo } from 'react';
import { institutionalStats } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import type { User } from '@/lib/types';

export function Stats() {
  const firestore = useFirestore();

  const graduatesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', '==', 'graduate'));
  }, [firestore]);

  const { data: graduates, loading } = useCollection<User>(graduatesQuery);

  const allStats = useMemo(() => {
    const dynamicStat = {
      value: loading ? '...' : `${(graduates?.length ?? 0).toLocaleString()}+`,
      label: 'Graduados',
      loading: loading,
    };
    
    const staticStats = institutionalStats.map(stat => ({ ...stat, loading: false }));

    return [dynamicStat, ...staticStats];

  }, [loading, graduates]);

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-headline text-3xl sm:text-4xl font-bold">UCN en Cifras</h2>
            <p className="mt-3 text-lg text-muted-foreground">
                El impacto de nuestra comunidad académica a través de los años.
            </p>
        </div>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {allStats.map((stat) => (
            <Card key={stat.label} className="flex flex-col items-center justify-center p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="text-5xl font-bold text-primary font-headline h-14 flex items-center justify-center">
                  {stat.loading ? <Skeleton className="h-12 w-32" /> : stat.value}
                </div>
                <div className="mt-2 text-base text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
