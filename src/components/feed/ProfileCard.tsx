'use client';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, MapPin, User as UserIcon, Edit } from 'lucide-react';
import Link from 'next/link';

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
  const getInitials = (name: string = '') => name.split(' ').map((n) => n[0]).join('');

  return (
    <Card className="sticky top-20 shadow-md">
      <CardContent className="p-6 text-center">
        <Link href={`/alumni/${user.uid}`}>
            <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary">
            <AvatarImage src={user.photoUrl} alt={user.fullName} />
            <AvatarFallback className="text-3xl">{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
        </Link>
        <h2 className="text-xl font-bold font-headline">{user.fullName}</h2>
        <p className="text-primary">{user.career}</p>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span>Promoción {user.graduationYear}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Sede {user.campus}</span>
            </div>
        </div>
        <div className="mt-6 flex flex-col gap-2">
            <Button asChild>
                <Link href={`/alumni/${user.uid}`}>
                    <UserIcon className="mr-2" /> Mi Perfil
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
