"use client";
'use client';
import { useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Post, Job, User } from '@/lib/types';
import { PostCard } from './PostCard';
import { JobFeedCard } from './JobFeedCard';
import { Loader2, MessageSquareText } from 'lucide-react';
import { Card } from '../ui/card';

export function Timeline() {
  const firestore = useFirestore();
  
  const postsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: posts, loading: postsLoading } = useCollection<Post>(postsQuery);
  
  const jobsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobs'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: jobs, loading: jobsLoading } = useCollection<Job>(jobsQuery);

  const companyIdsForJobs = useMemo(() => {
    if (!jobs) return [];
    return [...new Set(jobs.map(job => job.companyId))];
  }, [jobs]);

  const companiesQuery = useMemo(() => {
    if (!firestore || companyIdsForJobs.length === 0) return null;
    // Firestore 'in' queries are limited to 30 elements.
    // For a larger app, this would need pagination or a different approach.
    return query(collection(firestore, 'users'), where('uid', 'in', companyIdsForJobs.slice(0, 30)));
  }, [firestore, companyIdsForJobs]);

  const { data: companies, loading: companiesLoading } = useCollection<User>(companiesQuery);

  const companyPhotoMap = useMemo(() => {
    if (!companies) return new Map<string, string>();
    return new Map(companies.map(c => [c.uid, c.photoUrl || '']));
  }, [companies]);

  const feedItems = useMemo(() => {
    const typedPosts = (posts || []).map(p => ({ ...p, itemType: 'post' as const }));
    const typedJobs = (jobs || []).map(j => ({ ...j, itemType: 'job' as const }));

    const allItems = [...typedPosts, ...typedJobs];

    allItems.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    
    return allItems;
  }, [posts, jobs]);

  const loading = postsLoading || jobsLoading || (companyIdsForJobs.length > 0 && companiesLoading);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {feedItems && feedItems.length > 0 ? (
        feedItems.map((item) => {
           if (item.itemType === 'post') {
             return <PostCard key={`post-${item.id}`} post={item} />
           } else {
             const companyPhotoUrl = companyPhotoMap.get(item.companyId);
             return <JobFeedCard key={`job-${item.id}`} job={item} companyPhotoUrl={companyPhotoUrl} />
           }
        })
      ) : (
        <Card className="min-h-[200px] flex flex-col items-center justify-center text-center p-8 border-dashed">
            <MessageSquareText className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold font-headline text-muted-foreground">
                No hay actividad en el feed todavía
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">
                ¡Sé el primero en compartir algo o publicar una vacante!
            </p>
        </Card>
      )}
    </div>
  );
}
