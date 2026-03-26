"use client";
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { DashboardLayout } from './DashboardLayout';
import { useUser, useFirebaseApp } from '@/firebase';
import { Loader2, Clock, AlertTriangle, Ban, LogOut, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';


export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || '';
    const { user, loading } = useUser();
    const app = useFirebaseApp();
    const { toast } = useToast();
    const router = useRouter();

    const [isClient, setIsClient] = useState(false);
    const [hasSeenWelcome, setHasSeenWelcome] = useState(true);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && user && user.status === 'approved') {
            const seen = localStorage.getItem(`welcome_seen_${user.uid}`);
            if (!seen) {
                setHasSeenWelcome(false);
            } else {
                setHasSeenWelcome(true);
            }
        }
    }, [user, isClient]);

    const handleContinueFromWelcome = () => {
        if (user) {
            localStorage.setItem(`welcome_seen_${user.uid}`, 'true');
            setHasSeenWelcome(true);
        }
    };

    const handleLogout = async () => {
        if (!app) return;
        const auth = getAuth(app);
        await signOut(auth);
        toast({ title: 'Sesión cerrada' });
        router.push('/');
    };

    if (!isClient || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    const publicOnlyRoutes = ['/'];
    const authRoutes = ['/register'];
    
    const isPublicOnlyPage = publicOnlyRoutes.includes(pathname);
    const isAuthPage = authRoutes.some(route => pathname.startsWith(route));

    // For logged-in users on protected pages
    if (user && !isPublicOnlyPage && !isAuthPage) {
        // Admin role check
        if (user.role === 'admin' && !pathname.startsWith('/admin')) {
            router.replace('/admin');
            return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
        }
        
        // Status checks for non-admin users
        if (user.role !== 'admin') {
            // Special one-time welcome screen for newly approved users
            if (user.status === 'approved' && !hasSeenWelcome) {
                return (
                    <div className="flex h-screen items-center justify-center bg-muted/40">
                        <Card className="w-full max-w-md text-center shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
                                    <CheckCircle className="text-green-500 h-7 w-7"/>
                                    ¡Solicitud Aprobada!
                                </CardTitle>
                                <CardDescription>La Universidad Central de Nicaragua ha aprobado su solicitud.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Ahora puede compartir sus experiencias como graduado y formar parte activa de nuestra comunidad.</p>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleContinueFromWelcome} className="w-full">Continuar</Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            }

            switch (user.status) {
                case 'pending':
                    return (
                        <div className="flex h-screen items-center justify-center bg-muted/40">
                            <Card className="w-full max-w-md text-center shadow-lg">
                                <CardHeader>
                                    <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
                                        <Clock className="text-primary"/>
                                        Solicitud en Revisión
                                    </CardTitle>
                                    <CardDescription>Gracias por registrarte en UCN Connecta.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">Tu solicitud está siendo revisada por nuestro equipo administrativo. Este proceso puede tardar entre 24 y 48 horas. Recibirás una notificación por correo electrónico una vez que tu cuenta sea aprobada.</p>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleLogout} className="w-full"><LogOut className="mr-2"/>Cerrar Sesión</Button>
                                </CardFooter>
                            </Card>
                        </div>
                    );
                case 'rejected':
                     return (
                        <div className="flex h-screen items-center justify-center bg-muted/40">
                            <Card className="w-full max-w-md text-center shadow-lg">
                                <CardHeader>
                                    <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2 text-destructive"><AlertTriangle/>Solicitud Rechazada</CardTitle>
                                     <CardDescription>Su solicitud no ha sido aprobada por la Universidad Central de Nicaragua.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">Si considera que esto es un error o desea más información, puede contactarnos.</p>
                                </CardContent>
                                <CardFooter className="flex flex-col sm:flex-row gap-2">
                                    <Button onClick={handleLogout} variant="secondary" className="w-full"><LogOut className="mr-2"/>Cerrar Sesión</Button>
                                    <Button asChild className="w-full"><a href="mailto:soporte@ucn.edu.ni">Contactar Soporte</a></Button>
                                </CardFooter>
                            </Card>
                        </div>
                    );
                case 'deleted':
                    return (
                        <div className="flex h-screen items-center justify-center bg-muted/40">
                            <Card className="w-full max-w-md text-center shadow-lg">
                                <CardHeader>
                                    <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2 text-destructive"><Ban/>Cuenta Eliminada</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">Tu cuenta ha sido eliminada. Si crees que esto es un error, por favor, ponte en contacto con la administración de la universidad.</p>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleLogout} className="w-full"><LogOut className="mr-2"/>Cerrar Sesión</Button>
                                </CardFooter>
                            </Card>
                        </div>
                    );
            }
        }
        
        // If approved and welcome seen (or admin), show the dashboard layout.
        return (
            <DashboardLayout>
                {children}
            </DashboardLayout>
        );
    }
    
    // For logged-out users, or logged-in users on public/auth pages
    return (
        <>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <Toaster />
        </>
    );
}
