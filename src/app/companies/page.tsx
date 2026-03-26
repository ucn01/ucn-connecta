"use client";
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Building, MapPin } from 'lucide-react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
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
import { companySectors, campuses as locations } from '@/lib/data';

export default function CompaniesDirectoryPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const companiesQuery = useMemo(() => {
    if (!firestore) return null;
    // Query for all users with role 'company'.
    return query(collection(firestore, 'users'), where('role', '==', 'company'));
  }, [firestore]);

  const { data: companies, loading } = useCollection<User>(companiesQuery);

  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    return companies.filter(
      (company) =>
        (company.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.companySector?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (sectorFilter ? company.companySector === sectorFilter : true) &&
        (locationFilter ? company.companyLocation === locationFilter : true)
    );
  }, [companies, searchTerm, sectorFilter, locationFilter]);
  
  const getInitials = (name: string = '') => {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-headline font-bold text-primary">
            Directorio de Empresas
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Explora las empresas asociadas a la red UCN Connecta. Encuentra oportunidades y establece conexiones valiosas.
          </p>
        </div>

        <div className="mb-8 max-w-4xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar empresas por nombre o sector..."
              className="pl-12 h-12 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select onValueChange={(value) => setSectorFilter(value === "all" ? "" : value)} value={sectorFilter}>
                <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Filtrar por sector" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los sectores</SelectItem>
                    {companySectors.map(sector => <SelectItem key={sector} value={sector}>{sector}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select onValueChange={(value) => setLocationFilter(value === "all" ? "" : value)} value={locationFilter}>
                <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Filtrar por ubicación" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas las ubicaciones</SelectItem>
                    {locations.map(location => <SelectItem key={location} value={location}>{location}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
           <div className="flex justify-center items-center h-64">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
           </div>
        ) : !companies || companies.length === 0 ? (
           <p className="text-center text-muted-foreground mt-12 text-lg">
            No hay empresas registradas aún.
          </p>
        ) : filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <Link href={`/companies/${company.uid}`} key={company.uid}>
                <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
                  <CardContent className="p-6 flex flex-col items-center text-center flex-grow">
                    <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
                      <AvatarImage src={company.photoUrl} alt={company.companyName} />
                      <AvatarFallback className="text-3xl bg-muted">
                        <Building />
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold font-headline">
                      {company.companyName}
                    </h3>
                    <p className="text-primary">{company.companySector}</p>
                    {company.companyLocation && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {company.companyLocation}
                        </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
            <p className="text-center text-muted-foreground mt-12 text-lg">
                No se encontraron empresas que coincidan con tu búsqueda.
            </p>
        )}
      </div>
    </div>
  );
}
