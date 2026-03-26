"use client";
'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';

interface Application {
  id: string;
  userName?: string;
  jobTitle?: string;
  cvUrl: string;
}

export default function ApplicationsPage() {
  const db = useFirestore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'applications'));

        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Application[];

        setApplications(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [db]);

  return (
    <div className="p-6 space-y-6">
      
      <h1 className="text-2xl font-bold">Solicitudes</h1>

      {loading && (
        <p className="text-muted-foreground">Cargando solicitudes...</p>
      )}

      {!loading && applications.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No hay ninguna solicitud aún.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <CardTitle>
                {app.userName || 'Postulante'}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Puesto: {app.jobTitle || 'No especificado'}
              </p>

              <Button asChild>
                <a href={app.cvUrl} target="_blank">
                  Ver / Descargar CV
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
