'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export function LoginDialog({ children }: { children: React.ReactNode }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    
    const app = useFirebaseApp();
    const { toast } = useToast();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if(!app) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Firebase not initialized.',
            });
            setIsLoading(false);
            return;
        }

        const auth = getAuth(app);
        const firestore = getFirestore(app);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDocRef = doc(firestore, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            toast({
                title: 'Inicio de sesión exitoso',
                description: '¡Bienvenido de vuelta!',
            });
            setOpen(false); // Close dialog on success
            
            if (userDoc.exists() && userDoc.data().role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/my-profile');
            }
        } catch (error: any) {
            console.error("Login Error:", error);
            toast({
                variant: 'destructive',
                title: 'Error al iniciar sesión',
                description: 'Correo o contraseña incorrectos.',
            });
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Image src="https://i.ibb.co/S4vhbXBM/LOGO-UCN-500-X500-fondo-blanco-PNG.png" alt="Logo UCN Conecta" width={48} height={48} />
          </div>
          <DialogTitle className="text-center font-headline text-2xl">
            Iniciar Sesión
          </DialogTitle>
          <DialogDescription className="text-center">
            Accede a tu cuenta de UCN Connecta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin}>
            <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
            </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          ¿No tienes una cuenta?{' '}
          <DialogClose asChild>
            <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/register">Regístrate</Link>
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
