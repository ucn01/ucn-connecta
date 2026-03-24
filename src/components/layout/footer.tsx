'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  MapPin,
  Phone,
  LogOut,
} from 'lucide-react';
import { LoginDialog } from '../auth/login-dialog';
import { useUser } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Image from 'next/image';


export function Footer() {
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
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  }

  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/ucn.edu.ni' },
    { icon: Instagram, href: 'https://www.instagram.com/ucn_nicaragua' },
    { icon: Twitter, href: 'https://twitter.com/ucn_nicaragua' },
    {
      icon: Linkedin,
      href: 'https://www.linkedin.com/school/universidad-central-de-nicaragua/',
    },
    { icon: Youtube, href: 'https://www.youtube.com/user/UCNicaragua' },
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="https://i.ibb.co/S4vhbXBM/LOGO-UCN-500-X500-fondo-blanco-PNG.png" alt="Logo UCN Conecta" width={40} height={40} />
              <span className="font-bold text-lg font-headline">
                UCN Connecta
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Fortaleciendo la red profesional de egresados de la Universidad
              Central de Nicaragua.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-headline font-semibold">Contacto</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-1 shrink-0" />
                <a
                  href="https://maps.app.goo.gl/your-google-maps-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Sede Central: De los semáforos del Zumen 2c. al Oeste, 2c. al
                  Sur, Managua
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2 shrink-0" />
                <a
                  href="tel:+50522798600"
                  className="hover:text-primary transition-colors"
                >
                  (+505) 2279-8600
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-headline font-semibold">Acceso Rápido</h4>
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2 lg:flex-col lg:space-y-2 lg:space-x-0">
              {!loading &&
                (user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                         <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={user.photoUrl} />
                            <AvatarFallback>{getInitials(user.fullName || user.companyName)}</AvatarFallback>
                        </Avatar>
                        <span>Mi Cuenta</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        {user.role === 'graduate' ? user.fullName : user.companyName}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild><Link href={`/my-profile`}>Mi Perfil</Link></DropdownMenuItem>
                      {user.role === 'admin' && <DropdownMenuItem asChild><Link href="/dashboard">Dashboard</Link></DropdownMenuItem>}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <LoginDialog>
                      <Button variant="outline" className="w-full justify-start">
                        Iniciar sesión
                      </Button>
                    </LoginDialog>
                    <Button asChild className="w-full justify-start">
                      <Link href="/register">Registrarse</Link>
                    </Button>
                  </>
                ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-headline font-semibold">Mantente Informado</h4>
            <p className="text-sm text-muted-foreground">
              Suscríbete a nuestro boletín para recibir noticias y
              oportunidades.
            </p>
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="tu@email.com"
                className="bg-background"
              />
              <Button type="submit" variant="accent">
                Suscribirse
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Universidad Central de Nicaragua.
            Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
