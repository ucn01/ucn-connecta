'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'; // 👈 agregado
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebaseApp } from '@/firebase';
import { useRouter } from 'next/navigation';

const passwordValidation = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
);

const formSchema = z.object({
  companyName: z
    .string()
    .min(2, { message: 'El nombre de la empresa es requerido.' }),
  hrManagerName: z
    .string()
    .min(2, { message: 'El nombre del responsable es requerido.' }),
  hrManagerEmail: z.string().email({ message: 'Correo electrónico inválido.' }),
  hrManagerPhone: z
    .string()
    .min(8, { message: 'El número de teléfono es requerido.' }),
  adminName: z.string().min(2, { message: 'El nombre es requerido.' }),
  adminPosition: z.string().min(2, { message: 'El cargo es requerido.' }),
  adminArea: z.string().min(2, { message: 'El área es requerida.' }),
  adminPhone: z.string().min(8, { message: 'El teléfono es requerido.' }),
  adminEmail: z.string().email({ message: 'Correo electrónico inválido.' }),
  password: z.string().regex(passwordValidation, {
    message:
      'La contraseña debe tener 8+ caracteres, mayúscula, número y un caracter especial.',
  }),
});

export function CompanyRegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 agregado
  const { toast } = useToast();
  const app = useFirebaseApp();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!app) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Firebase not initialized.",
        });
        setIsLoading(false);
        return;
    }
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.adminEmail,
        values.password
      );
      const user = userCredential.user;

      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        role: 'company',
        status: 'pending',
        createdAt: serverTimestamp(),
        email: values.adminEmail,
        companyName: values.companyName,
        hrManagerName: values.hrManagerName,
        hrManagerEmail: values.hrManagerEmail,
        hrManagerPhone: values.hrManagerPhone,
        adminName: values.adminName,
        adminPosition: values.adminPosition,
        adminArea: values.adminArea,
        adminPhone: values.adminPhone,
        photoUrl: `https://avatar.vercel.sh/${values.companyName}.png?text=${values.companyName?.charAt(0)}`,
      });

      toast({
          title: "¡Registro de Empresa Completado!",
          description: "Su solicitud está en revisión. Será notificado cuando su cuenta sea aprobada."
      });

      router.push('/dashboard');

    } catch (error: any) {
      console.error('Registration Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error en el registro',
        description:
          error.code === 'auth/email-already-in-use'
            ? 'Este correo electrónico ya está en uso.'
            : 'Ocurrió un error. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          Registro de Empresa
        </CardTitle>
        <CardDescription>
          Crea un perfil para publicar ofertas laborales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium font-headline">
                Información de la Empresa
              </h3>
              <Separator className="my-2" />
              <div className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Mi Empresa S.A." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hrManagerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsable de RRHH</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nombre del responsable"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hrManagerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono de RRHH</FormLabel>
                        <FormControl>
                          <Input placeholder="8888-8888" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="hrManagerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo de RRHH</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="rrhh@empresa.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium font-headline">
                Datos del Administrador de la Cuenta
              </h3>
              <Separator className="my-2" />
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu cargo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="adminArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Área</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu área" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="8888-8888" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 👁️ SOLO AQUÍ CAMBIO */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            {...field}
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Registrar Empresa
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}