'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { User } from '@/lib/types';
import { Image as ImageIcon, Loader2, PlusCircle } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

interface CreatePostDialogProps {
  user: User;
}

const formSchema = z.object({
  content: z.string().min(1, 'El contenido no puede estar vacío.').max(1000, 'El post es demasiado largo.'),
});

export function CreatePostDialog({ user }: CreatePostDialogProps) {
  const authorName = user.role === 'graduate' ? user.fullName : user.companyName;
  const getInitials = (name: string = '') => name?.split(' ').map((n) => n[0]).join('') || '';
  
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: '' },
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user) return;
    setIsLoading(true);

    try {
      const postData: { [key: string]: any } = {
        authorId: user.uid,
        authorName: authorName,
        authorRole: user.role,
        authorPhotoUrl: user.photoUrl,
        content: values.content,
        createdAt: serverTimestamp(),
      };

      if (user.role === 'graduate') {
        postData.authorCareer = user.career;
        postData.authorCampus = user.campus;
      }
      
      await addDoc(collection(firestore, 'posts'), postData);
      form.reset();
      toast({ title: '¡Publicación creada!' });
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error al crear la publicación.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary"><PlusCircle className="mr-2" />Crear publicación</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Publicación</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={user.photoUrl} />
                <AvatarFallback>{getInitials(authorName!)}</AvatarFallback>
              </Avatar>
              <div className="w-full">
                  <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                      <FormItem>
                      <FormControl>
                          <Textarea
                          placeholder="Comparte tu historia con la comunidad UCN..."
                          className="min-h-[120px] resize-none"
                          {...field}
                          />
                      </FormControl>
                      </FormItem>
                  )}
                  />
              </div>
            </div>
             <Separator />
            <DialogFooter className="!justify-between items-center">
                <div>
                    <label htmlFor="post-dialog-image-upload" className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-muted">
                        <ImageIcon className="text-green-500" />
                        <span className="text-sm font-medium text-muted-foreground">Foto</span>
                    </label>
                    <input id="post-dialog-image-upload" type="file" accept="image/*" className="hidden" />
                </div>
              <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publicar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
