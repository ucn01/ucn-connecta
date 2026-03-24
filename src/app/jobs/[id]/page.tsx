'use client';

import { useMemo } from 'react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import type { Job, User, JobApplication } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Briefcase,
  MapPin,
  Clock,
  Building,
  Calendar,
  Globe,
  DollarSign,
  FileText,
  Check,
  Bookmark,
  Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ApplyForJobDialog } from '@/components/jobs/ApplyForJobDialog';

function InfoPill({ icon, value }: { icon: React.ReactNode, value?: string | number }) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {icon}
            <span>{value}</span>
        </div>
    );
}

export default function JobDetailPage() {
  const { id } = useParams();
  const firestore = useFirestore();
  const { user: currentUser, loading: userLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const jobDocRef = useMemo(() => {
    if (!firestore || !id || typeof id !== 'string') return null;
    return doc(firestore, 'jobs', id);
  }, [firestore, id]);
  const { data: job, loading: jobLoading } = useDoc<Job>(jobDocRef);
  
  const companyDocRef = useMemo(() => {
      if (!firestore || !job) return null;
      return doc(firestore, 'users', job.companyId);
  }, [firestore, job]);
  const { data: company, loading: companyLoading } = useDoc<User>(companyDocRef);

  const applicationDocRef = useMemo(() => {
      if (!firestore || !currentUser || !id || typeof id !== 'string') return null;
      return doc(firestore, 'job-applications', `${currentUser.uid}_${id}`);
  }, [firestore, currentUser, id]);
  const { data: application, loading: applicationLoading } = useDoc<JobApplication>(applicationDocRef);

  const hasApplied = !!application;

  const loading = userLoading || jobLoading || companyLoading || applicationLoading;

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!job) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold">Vacante no encontrada</h1>
        <p className="text-muted-foreground">La oferta de empleo que buscas no existe o fue eliminada.</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/40 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <Card className="mb-6">
            <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div>
                        {job.jobType && <Badge variant="secondary" className="mb-2">{job.jobType}</Badge>}
                        <CardTitle className="font-headline text-3xl">{job.title}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base mt-2">
                           <Link href={`/companies/${job.companyId}`} className="font-semibold text-primary hover:underline flex items-center gap-2"><Building className="h-4 w-4" />{job.companyName}</Link>
                           {job.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{job.location}</span>}
                        </CardDescription>
                    </div>
                     <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                        <div className="flex gap-2">
                           <Button variant="outline"><Bookmark className="mr-2"/>Guardar</Button>
                           {currentUser && currentUser.role === 'graduate' ? (
                                <ApplyForJobDialog job={job} user={currentUser}>
                                    <Button disabled={hasApplied}>
                                        {hasApplied ? <Check className="mr-2"/> : <Send className="mr-2"/>}
                                        {hasApplied ? 'Postulado' : 'Postularme'}
                                    </Button>
                                </ApplyForJobDialog>
                            ) : (
                                <Button disabled={!currentUser} onClick={() => {
                                    if (currentUser && currentUser.role !== 'graduate') {
                                        toast({ variant: 'destructive', title: 'Solo los graduados pueden postularse.' });
                                    } else if (!currentUser) {
                                        toast({ variant: 'destructive', title: 'Inicia sesión para postularte.' });
                                    }
                                }}>
                                    <Send className="mr-2"/>
                                    Postularme
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Publicado: {job.createdAt ? format(new Date(job.createdAt.seconds * 1000), 'd MMMM, yyyy', { locale: es }) : 'N/A'}
                        </p>
                    </div>
                </div>
            </CardHeader>
             {job.salary || job.applicationDeadline ? (
                <CardContent className="border-t pt-4">
                    <div className="flex flex-wrap gap-x-8 gap-y-2">
                        <InfoPill icon={<DollarSign size={18} className="text-primary"/>} value={job.salary}/>
                        {job.applicationDeadline && <InfoPill icon={<Calendar size={18} className="text-primary"/>} value={`Fecha límite: ${format(new Date(job.applicationDeadline.seconds * 1000), 'd MMMM, yyyy', { locale: es })}`}/>}
                    </div>
                </CardContent>
             ) : null}
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText />Descripción del Puesto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-muted-foreground">{job.description}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Check />Requisitos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-muted-foreground">{job.requirements}</p>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                {company && (
                    <Card>
                        <CardHeader className="p-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={company.photoUrl} alt={company.companyName} />
                                    <AvatarFallback><Building /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold font-headline text-lg">{company.companyName}</p>
                                    <p className="text-sm text-muted-foreground">{company.companySector}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                            <p className="line-clamp-4">{company.companyDescription}</p>
                             <Button asChild className="w-full mt-4">
                                <Link href={`/companies/${company.uid}`}>Ver perfil de la empresa</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
