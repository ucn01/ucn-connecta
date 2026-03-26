"use client";
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Calendar as CalendarIcon } from 'lucide-react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { generateCompanyJobDescription } from '@/ai/flows/generate-company-job-description-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  jobTitle: z.string().min(3, 'El título del puesto es requerido.'),
  location: z.string().min(3, 'La ubicación es requerida.'),
  salary: z.string().optional(),
  jobType: z.string({ required_error: 'El tipo de empleo es requerido.' }),
  applicationDeadline: z.date().optional(),
  requirements: z.string().min(10, 'Los requisitos son muy cortos.'),
  description: z.string().min(20, 'La descripción es muy corta.'),
});

export default function CreateJobPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobTitle: '',
      location: '',
      salary: '',
      requirements: '',
      description: '',
    },
  });
  
  if (!userLoading && (!user || user.role !== 'company')) {
      router.replace('/jobs');
      return null;
  }

  const handleGenerateDescription = async () => {
    const { jobTitle, requirements, description } = form.getValues();
    if (!jobTitle) {
      toast({ variant: 'destructive', title: 'El título del puesto es necesario para la IA.' });
      return;
    }
    
    setIsAiLoading(true);
    try {
        const result = await generateCompanyJobDescription({
            jobTitle,
            responsibilities: description,
            requirements
        });
        if(result.jobDescription) {
            form.setValue('description', result.jobDescription);
            toast({ title: 'Descripción generada con IA' });
        }
    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error al generar con IA.' });
    } finally {
        setIsAiLoading(false);
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error inesperado' });
      setIsLoading(false);
      return;
    }
    
    try {
      await addDoc(collection(firestore, 'jobs'), {
        title: values.jobTitle,
        location: values.location,
        salary: values.salary,
        jobType: values.jobType,
        applicationDeadline: values.applicationDeadline,
        requirements: values.requirements,
        description: values.description,
        companyId: user.uid,
        companyName: user.companyName,
        createdAt: serverTimestamp(),
        status: 'active',
      });
      toast({ title: 'Oferta de empleo publicada' });
      router.push('/jobs');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'No se pudo publicar la oferta.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Publicar Nueva Oferta Laboral
            </CardTitle>
            <CardDescription>
              Completa los detalles de la vacante que tu empresa necesita cubrir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del Puesto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Ingeniero de Software Senior" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ubicación</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Managua, Nicaragua" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="salary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salario (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: US$1500 - US$2000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="jobType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tipo de Empleo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione el tipo" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Tiempo completo">Tiempo completo</SelectItem>
                                    <SelectItem value="Medio tiempo">Medio tiempo</SelectItem>
                                    <SelectItem value="Prácticas">Prácticas</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="applicationDeadline"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Fecha Límite de Aplicación (Opcional)</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP", { locale: es })
                                    ) : (
                                        <span>Seleccione una fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requisitos</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ej: 5+ años de experiencia con React, NodeJS..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Puesto</FormLabel>
                       <div className="relative">
                            <FormControl>
                                <Textarea
                                placeholder="Describe las responsabilidades, el equipo, y lo que ofrecen..."
                                className="min-h-[200px]"
                                {...field}
                                />
                            </FormControl>
                            <div className="absolute bottom-2 right-2">
                                <Button type="button" size="sm" onClick={handleGenerateDescription} disabled={isAiLoading}>
                                    {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                                    Generar con IA
                                </Button>
                            </div>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Publicar Oferta
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
