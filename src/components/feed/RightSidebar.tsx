'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Building, Loader2 } from "lucide-react";
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { User, Job } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';

export function RightSidebar() {
    const firestore = useFirestore();

    // Fetch all users to sort/filter client-side, avoiding complex queries that need indexes.
    const usersQuery = useMemo(() => 
        firestore ? query(collection(firestore, 'users')) : null,
    [firestore]);
    const { data: allUsers, loading: usersLoading } = useCollection<User>(usersQuery);

    const recentGraduates = useMemo(() => {
        if (!allUsers) return [];
        return allUsers
            .filter(u => u.role === 'graduate')
            .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
            .slice(0, 3);
    }, [allUsers]);

    const associatedCompanies = useMemo(() => {
        if (!allUsers) return [];
        return allUsers
            .filter(u => u.role === 'company')
            .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
            .slice(0, 3);
    }, [allUsers]);

    const recentJobsQuery = useMemo(() =>
        firestore ? query(collection(firestore, 'jobs'), orderBy('createdAt', 'desc'), limit(3)) : null,
    [firestore]);
    const { data: recentJobs, loading: jobsLoading } = useCollection<Job>(recentJobsQuery);
    
    const getInitials = (name: string = '') => name?.split(' ').map((n) => n[0]).join('') || '';

    const graduatesLoading = usersLoading;
    const companiesLoading = usersLoading;

    return (
        <div className="space-y-6 sticky top-20">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-headline">Graduados Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    {graduatesLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <div key={i} className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-[150px]" /><Skeleton className="h-3 w-[100px]" /></div></div>)}
                        </div>
                    ) : recentGraduates && recentGraduates.length > 0 ? (
                        <ul className="space-y-4">
                            {recentGraduates.map((grad) => (
                                <li key={grad.uid} className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={grad.photoUrl} alt={grad.fullName} />
                                        <AvatarFallback>{getInitials(grad.fullName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <Link href={`/alumni/${grad.uid}`} className="hover:underline">
                                            <p className="font-semibold text-sm">{grad.fullName}</p>
                                        </Link>
                                        <p className="text-xs text-muted-foreground">{grad.career}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-center text-muted-foreground">No hay graduados recientes.</p>
                    )}
                </CardContent>
            </Card>
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-headline">Empresas Asociadas</CardTitle>
                </CardHeader>
                <CardContent>
                    {companiesLoading ? (
                         <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <div key={i} className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-[150px]" /></div></div>)}
                        </div>
                    ) : associatedCompanies && associatedCompanies.length > 0 ? (
                        <ul className="space-y-4">
                            {associatedCompanies.map((company) => (
                                <li key={company.uid} className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={company.photoUrl} alt={company.companyName} />
                                        <AvatarFallback><Building size={18} /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <Link href={`/companies/${company.uid}`} className="hover:underline">
                                            <p className="font-semibold text-sm">{company.companyName}</p>
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-center text-muted-foreground">No hay empresas registradas.</p>
                    )}
                </CardContent>
            </Card>
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-headline">Ofertas Laborales</CardTitle>
                </CardHeader>
                <CardContent>
                    {jobsLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <div key={i} className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-1/2" /></div>)}
                        </div>
                    ) : recentJobs && recentJobs.length > 0 ? (
                        <>
                            <ul className="space-y-4">
                                {recentJobs.map((job) => (
                                    <li key={job.id}>
                                         <Link href={`/jobs/${job.id}`} className="hover:underline">
                                            <p className="font-semibold text-sm">{job.title}</p>
                                         </Link>
                                        <p className="text-xs text-muted-foreground">{job.companyName}</p>
                                    </li>
                                ))}
                            </ul>
                            <Button variant="outline" className="w-full mt-4" asChild>
                                <Link href="/jobs">Ver todas las ofertas</Link>
                            </Button>
                        </>
                    ) : (
                         <p className="text-xs text-center text-muted-foreground">No hay ofertas de empleo recientes.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
