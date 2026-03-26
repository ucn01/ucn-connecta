"use client";
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
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react'; // 👈 agregado
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export function LoginDialog({ children }: { children: React.ReactNode }) {

    const [mode, setMode] = useState<'login' | 'reset'>('login');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false); // 👈 agregado

    const [isLoading, setIsLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [open, setOpen] = useState(false);

    const app = useFirebaseApp();
    const { toast } = useToast();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if(!app) return;

        const auth = getAuth(app);
        const firestore = getFirestore(app);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDoc = await getDoc(doc(firestore, 'users', user.uid));

            toast({
                title: 'Inicio de sesión exitoso',
                description: '¡Bienvenido de vuelta!',
            });

            setOpen(false);

            if (userDoc.exists() && userDoc.data().role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/my-profile');
            }

        } catch {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Correo o contraseña incorrectos.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!app || !resetEmail) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Ingrese un correo válido.',
            });
            return;
        }

        setIsResetting(true);
        const auth = getAuth(app);

        try {
            await sendPasswordResetEmail(auth, resetEmail);

            toast({
                title: 'Correo enviado',
                description: 'Revise su correo para recuperar su contraseña.',
            });

            setMode('login');
            setResetEmail('');

        } catch (error: any) {
            console.error("RESET ERROR:", error.code, error.message);

            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message,
            });
        } finally {
            setIsResetting(false);
        }
    };

  return (
    <Dialog open={open} onOpenChange={(val) => {
        setOpen(val);
        if (!val) setMode('login');
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">

        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Image src="https://i.ibb.co/S4vhbXBM/LOGO-UCN-500-X500-fondo-blanco-PNG.png" alt="Logo UCN" width={48} height={48} />
          </div>

          <DialogTitle className="text-center text-2xl">
            {mode === 'login' ? 'Iniciar Sesión' : 'Recuperar Contraseña'}
          </DialogTitle>

          <DialogDescription className="text-center">
            {mode === 'login'
              ? 'Accede a su cuenta de UCN Connecta.'
              : 'Ingrese su correo para recuperar su contraseña.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="grid gap-4 py-4">

              <div>
                <Label>Correo electrónico</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label>Contraseña</Label>

                {/* 👁️ INPUT CON OJO */}
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

            </div>

            <Button className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 animate-spin" />}
              Iniciar Sesión
            </Button>

            <p className="text-center text-sm mt-3">
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-green-600 hover:underline"
              >
                ¿Olvidó su contraseña?
              </button>
            </p>
          </form>
        )}

        {mode === 'reset' && (
          <div className="space-y-4 py-4">

            <Input
              type="email"
              placeholder="Ingrese su correo"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />

            <Button
              className="w-full"
              onClick={handleResetPassword}
              disabled={isResetting}
            >
              {isResetting && <Loader2 className="mr-2 animate-spin" />}
              Enviar enlace de recuperación
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setMode('login')}
            >
              ← Volver al inicio de sesión
            </Button>

          </div>
        )}

        <div className="text-center text-sm">
          ¿No tiene una cuenta?{' '}
          <DialogClose asChild>
            <Link href="/register" className="text-green-600 hover:underline">
              Regístrese
            </Link>
          </DialogClose>
        </div>

      </DialogContent>
    </Dialog>
  );
}
