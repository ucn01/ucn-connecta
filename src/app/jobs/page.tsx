'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Briefcase, Loader2, PlusCircle, MapPin, DollarSign, Clock } from "lucide-react";
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import type { Job } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function JobsPage() {
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();

  const jobsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobs'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: jobs, loading: jobsLoading } = useCollection<Job>(jobsQuery);

  const isLoading = userLoading || jobsLoading;

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-headline font-bold text-primary">
          Oportunidades Laborales
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Conecta con tu próximo desafío profesional. Aquí encontrarás vacantes publicadas por empresas de nuestra red.
        </p>
      </div>

       {user?.role === 'company' && (
         <div className="mb-8 flex justify-end">
            <Button asChild>
                <Link href="/jobs/create">
                    <PlusCircle className="mr-2" />
                    Publicar Nueva Vacante
                </Link>
            </Button>
         </div>
       )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : jobs && jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map(job => (
                <Card key={job.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="font-headline text-xl">{job.title}</CardTitle>
                          <CardDescription>
                              <Link href={`/companies/${job.companyId}`} className="font-semibold hover:underline">{job.companyName}</Link>
                          </CardDescription>
                        </div>
                        {job.jobType && <Badge variant="secondary">{job.jobType}</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
                        <div className="text-sm text-muted-foreground space-y-2">
                          {job.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{job.location}</span>
                            </div>
                          )}
                          {job.salary && (
                             <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <span>{job.salary}</span>
                            </div>
                          )}
                           {job.applicationDeadline && (
                             <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Límite: {format(new Date(job.applicationDeadline.seconds * 1000), 'dd/MM/yyyy')}</span>
                            </div>
                          )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
                       <span>{job.createdAt ? format(new Date(job.createdAt.seconds * 1000), 'dd/MM/yyyy') : ''}</span>
                       <Button variant="secondary" size="sm" asChild>
                          <Link href={`/jobs/${job.id}`}>Ver Detalles</Link>
                       </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      ) : (
        <Card className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-dashed">
            <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold font-headline text-muted-foreground">
            Aún no hay ofertas de empleo
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">
            Estamos trabajando para traerte las mejores oportunidades laborales. ¡Vuelve pronto!
            </p>
        </Card>
      )}
    </div>
  );
}
