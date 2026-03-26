'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useFirebaseApp } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Upload, Send } from 'lucide-react';
import type { Job, User } from '@/lib/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// 🔒 SOLO PDF
const ACCEPTED_FILE_TYPES = ['application/pdf'];

const formSchema = z.object({
  cv: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, 'Debes subir tu CV.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `El tamaño máximo es 5MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      'Solo se aceptan archivos PDF'
    ),
});

interface ApplyForJobDialogProps {
  job: Job;
  user: User;
  children: React.ReactNode;
}

export function ApplyForJobDialog({ job, user, children }: ApplyForJobDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const app = useFirebaseApp();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !app || !user.fullName) {
      toast({ variant: 'destructive', title: 'Error de configuración o de datos del usuario.' });
      return;
    }
    
    setIsLoading(true);

    try {
      const cvFile = values.cv[0];
      const storage = getStorage(app);
      const storageRef = ref(storage, `cv_uploads/${user.uid}/${job.id}/${cvFile.name}`);

      await uploadBytes(storageRef, cvFile);
      const cvUrl = await getDownloadURL(storageRef);
      
      const applicationRef = doc(firestore, 'job-applications', `${user.uid}_${job.id}`);
      
      await setDoc(applicationRef, {
        jobId: job.id,
        companyId: job.companyId,
        userId: user.uid,
        applicantName: user.fullName,
        cvUrl: cvUrl,
        status: 'sent',
        appliedAt: serverTimestamp(),
      });
      
      toast({
        description: "Gracias por compartirnos su CV. Estaremos revisando su información.",
      });

      setOpen(false);
      form.reset();

    } catch (error) {
      console.error('Application Error:', error);
      toast({
        variant: 'destructive',
        title: 'No se pudo enviar la postulación. Intente nuevamente.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Postularse a: {job.title}</DialogTitle>
          <DialogDescription>
            Sube tu CV para que la empresa pueda revisar tu perfil.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cv"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Adjuntar Curriculum Vitae (PDF, max 5MB)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="file"
                        accept="application/pdf"
                        className="pl-10"
                        {...fieldProps}
                        onChange={(event) => {
                          onChange(event.target.files);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2" />}
                Enviar postulación
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}