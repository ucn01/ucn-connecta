"use client";
'use client';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Globe, Edit, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

interface CompanyProfileCardProps {
  user: User;
}

export function CompanyProfileCard({ user }: CompanyProfileCardProps) {
  return (
    <Card className="sticky top-20 shadow-md">
      <CardContent className="p-6 text-center">
        <Link href={`/companies/${user.uid}`}>
            <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary">
            <AvatarImage src={user.photoUrl} alt={user.companyName} />
            <AvatarFallback className="text-3xl bg-muted"><Building /></AvatarFallback>
            </Avatar>
        </Link>
        <h2 className="text-xl font-bold font-headline">{user.companyName}</h2>
        <p className="text-primary">{user.companySector}</p>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            {user.companyLocation && (
                <div className="flex items-center justify-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>{user.companyLocation}</span>
                </div>
            )}
        </div>
        <div className="mt-6 flex flex-col gap-2">
            <Button asChild>
                <Link href={`/companies/${user.uid}`}>
                    <UserIcon className="mr-2" /> Ver Perfil
                </Link>
            </Button>
             <Button variant="secondary" asChild>
                <Link href="/my-profile">
                    <Edit className="mr-2" /> Editar Perfil
                </Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
