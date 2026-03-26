"use client";
;

import { useUser } from "...";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { User } from '@/lib/types';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

interface CreatePostProps {
  user: User;
}

const formSchema = z.object({
  content: z.string().min(1, 'El contenido no puede estar vacío.').max(1000, 'El post es demasiado largo.'),
});

export function CreatePost({ user }: CreatePostProps) {
  const getInitials = (name: string = '') => name.split(' ').map((n) => n[0]).join('');
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user) return;
    setIsLoading(true);

    try {
      const authorName = user.role === 'graduate' ? user.fullName : user.companyName;
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
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error al crear la publicación.' });
    } finally {
      setIsLoading(false);
    }
  };

  const authorName = user.role === 'graduate' ? user.fullName : user.companyName;

  return (
    <Card className="shadow-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={user.photoUrl} />
                <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
              </Avatar>
              <div className="w-full">
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                        <Textarea
                            placeholder={user.role === 'graduate' ? "Comparte tu historia de éxito con la comunidad UCN" : "Comparte una actualización de tu empresa..."}
                            className="bg-transparent border-none focus-visible:ring-0 text-base resize-none"
                            rows={3}
                            {...field}
                        />
                        </FormControl>
                    </FormItem>
                    )}
                />
              </div>
            </div>
          </CardContent>
          <Separator />
          <CardFooter className="p-2 flex justify-between items-center">
            <div>
                 <label htmlFor="post-image-upload" className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-muted">
                    <ImageIcon className="text-green-500" />
                    <span className="text-sm font-medium text-muted-foreground">Foto</span>
                </label>
                <input id="post-image-upload" type="file" accept="image/*" className="hidden" />
            </div>
            <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publicar
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
