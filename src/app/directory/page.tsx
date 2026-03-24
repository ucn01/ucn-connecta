'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { User } from '@/lib/types';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { careers, campuses } from '@/lib/data';

export default function DirectoryPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [careerFilter, setCareerFilter] = useState('');
  const [campusFilter, setCampusFilter] = useState('');

  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    // Query for all users. We will filter for graduates on the client.
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: allUsers, loading } = useCollection<User>(usersQuery);

  const graduates = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(user => user.role === 'graduate');
  }, [allUsers]);

  const filteredGraduates = useMemo(() => {
    if (!graduates) return [];
    return graduates.filter(
      (grad) =>
        (grad.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grad.career?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (careerFilter ? grad.career === careerFilter : true) &&
        (campusFilter ? grad.campus === campusFilter : true)
    );
  }, [graduates, searchTerm, careerFilter, campusFilter]);
  
  const getInitials = (name: string = '') => {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-headline font-bold text-primary">
            Directorio de Graduados
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Explora los perfiles de los talentosos profesionales que forman
            parte de la familia UCN. Conecta y colabora.
          </p>
        </div>

        <div className="mb-8 max-w-4xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar graduados por nombre o carrera..."
              className="pl-12 h-12 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select onValueChange={(value) => setCareerFilter(value === "all" ? "" : value)} value={careerFilter}>
                <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Filtrar por carrera" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas las carreras</SelectItem>
                    {careers.map(career => <SelectItem key={career} value={career}>{career}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select onValueChange={(value) => setCampusFilter(value === "all" ? "" : value)} value={campusFilter}>
                <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Filtrar por sede" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas las sedes</SelectItem>
                    {campuses.map(campus => <SelectItem key={campus} value={campus}>{campus}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
           <div className="flex justify-center items-center h-64">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
           </div>
        ) : !graduates || graduates.length === 0 ? (
           <p className="text-center text-muted-foreground mt-12 text-lg">
            No hay graduados registrados aún.
          </p>
        ) : filteredGraduates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGraduates.map((grad) => (
              <Link href={`/alumni/${grad.uid}`} key={grad.uid}>
                <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
                  <CardContent className="p-6 flex flex-col items-center text-center flex-grow">
                    <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
                      <AvatarImage src={grad.photoUrl} alt={grad.fullName} />
                      <AvatarFallback className="text-3xl bg-muted">
                        {getInitials(grad.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold font-headline">
                      {grad.fullName}
                    </h3>
                    <p className="text-primary">{grad.career}</p>
                    <p className="text-sm text-muted-foreground mt-1">Sede {grad.campus}</p>
                  </CardContent>
                  <div className="p-4 border-t text-center">
                    {grad.graduationYear && (
                        <Badge variant="secondary">
                            Promoción {grad.graduationYear}
                        </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
            <p className="text-center text-muted-foreground mt-12 text-lg">
                No se encontraron graduados que coincidan con tu búsqueda.
            </p>
        )}
      </div>
    </div>
  );
}
