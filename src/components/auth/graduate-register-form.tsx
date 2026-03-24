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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebaseApp } from '@/firebase';
import { useRouter } from 'next/navigation';
import { careers, campuses } from '@/lib/data';

const passwordValidation = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
);

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'El nombre completo es requerido.' }),
  idNumber: z.string().min(5, { message: 'El número de cédula es requerido.' }),
  phoneNumber: z
    .string()
    .min(8, { message: 'El número de teléfono es requerido.' }),
  career: z.string({ required_error: 'Debe seleccionar una carrera.' }),
  campus: z.string({ required_error: 'Debe seleccionar una sede.' }),
  graduationYear: z.coerce
    .number()
    .min(1990, 'Año inválido.')
    .max(new Date().getFullYear(), 'Año inválido.'),
  email: z.string().email({ message: 'Correo electrónico inválido.' }),
  password: z.string().regex(passwordValidation, {
    message:
      'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.',
  }),
});

export function GraduateRegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const app = useFirebaseApp();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      idNumber: '',
      phoneNumber: '',
      career: '',
      campus: '',
      email: '',
      password: '',
    },
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
        values.email,
        values.password
      );
      const user = userCredential.user;

      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        role: 'graduate',
        status: 'pending',
        createdAt: serverTimestamp(),
        email: values.email,
        fullName: values.fullName,
        idNumber: values.idNumber,
        phoneNumber: values.phoneNumber,
        career: values.career,
        campus: values.campus,
        graduationYear: values.graduationYear,
        photoUrl: `https://avatar.vercel.sh/${values.email}.png`,
        profileDescription: '',
      });
      
      toast({
          title: "¡Registro Exitoso!",
          description: "Tu solicitud está en revisión. Serás notificado cuando tu cuenta sea aprobada."
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
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          Registro de Graduado
        </CardTitle>
        <CardDescription>
          Completa el formulario para unirte a la red.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de cédula</FormLabel>
                  <FormControl>
                    <Input placeholder="001-000000-0000A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="8888-8888" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="career"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrera en la que se graduó</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una carrera" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {careers.map(career => (
                        <SelectItem key={career} value={career}>{career}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="campus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sede donde se graduó</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una sede" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campuses.map(campus => (
                         <SelectItem key={campus} value={campus}>{campus}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="graduationYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Año de graduación</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="2023" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        className="pr-10"
                        placeholder="********"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Enviar información para verificación
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
