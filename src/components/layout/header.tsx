"use client";
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '@/components/auth/login-dialog';
import { useUser } from '@/firebase/auth/use-user';
import { useFirebaseApp } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';

export function Header() {
  const { user, loading } = useUser();
  const app = useFirebaseApp();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!app) return;
    const auth = getAuth(app);
    await signOut(auth);
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión exitosamente.',
    });
  };

  const getInitials = (name: string = '') => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };
  
  const profileHref = user && user.role === 'graduate' ? `/alumni/${user.uid}` : '/my-profile';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Image src="https://i.ibb.co/S4vhbXBM/LOGO-UCN-500-X500-fondo-blanco-PNG.png" alt="Logo UCN Conecta" width={32} height={32} />
          <span className="hidden font-bold sm:inline-block font-headline">
            UCN Connecta
          </span>
        </Link>
        <nav className="flex items-center space-x-4 text-sm font-medium">
             <Link href="/directory" className="text-muted-foreground transition-colors hover:text-foreground">
                Graduados
            </Link>
             <Link href="/companies" className="text-muted-foreground transition-colors hover:text-foreground">
                Empresas
            </Link>
            <Link href="/jobs" className="text-muted-foreground transition-colors hover:text-foreground">
                Empleos
            </Link>
            <Link href="/historias-exito" className="text-muted-foreground transition-colors hover:text-foreground">
                Historias de Éxito
            </Link>
            <Link href="/news" className="text-muted-foreground transition-colors hover:text-foreground">
                Noticias
            </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            {loading ? (
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoUrl} alt={user.fullName || user.companyName} />
                      <AvatarFallback>
                        {getInitials(user.fullName || user.companyName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.role === 'graduate' ? user.fullName : user.companyName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   <DropdownMenuItem asChild>
                        <Link href="/dashboard">
                           <LayoutDashboard className="mr-2 h-4 w-4" />
                           <span>Feed Social</span>
                        </Link>
                    </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={profileHref}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <LoginDialog>
                  <Button variant="ghost">Iniciar sesión</Button>
                </LoginDialog>
                <Button asChild>
                  <Link href="/register">Registrarse</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
