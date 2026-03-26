"use client";
'use client';
import type { Job } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button, buttonVariants } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Building, MapPin, Briefcase, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';


interface JobFeedCardProps {
  job: Job;
  companyPhotoUrl?: string;
}

export function JobFeedCard({ job, companyPhotoUrl }: JobFeedCardProps) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAuthor = currentUser?.uid === job.companyId;

  const editJobSchema = z.object({
    title: z.string().min(3, 'El título del puesto es requerido.'),
    description: z.string().min(10, 'La descripción es muy corta.'),
  });

  const form = useForm<z.infer<typeof editJobSchema>>({
    resolver: zodResolver(editJobSchema),
    values: {
      title: job.title,
      description: job.description,
    }
  });

  const handleOpenChange = (open: boolean) => {
    if (open) {
      form.reset({ title: job.title, description: job.description });
    }
    setIsEditing(open);
  }

  const handleEditSubmit = async (values: z.infer<typeof editJobSchema>) => {
    if (!firestore || !isAuthor) return;
    setIsSaving(true);
    try {
        const jobRef = doc(firestore, 'jobs', job.id);
        await updateDoc(jobRef, {
            title: values.title,
            description: values.description,
        });
        toast({ title: "Vacante actualizada" });
        setIsEditing(false);
    } catch (error) {
        console.error("Error updating job:", error);
        toast({ variant: 'destructive', title: "Error al actualizar la vacante" });
    } finally {
        setIsSaving(false);
    }
  }

  const handleDelete = async () => {
    if (!firestore || !isAuthor) return;
    setIsDeleting(true);
    try {
        await deleteDoc(doc(firestore, 'jobs', job.id));
        toast({ title: "Vacante eliminada" });
    } catch (error) {
        console.error("Error deleting job:", error);
        toast({ variant: 'destructive', title: "Error al eliminar la vacante" });
    } finally {
        setIsDeleting(false);
        setShowDeleteAlert(false);
    }
  }

  const companyProfileLink = `/companies/${job.companyId}`;

  return (
    <>
      <Card className="shadow-none rounded-none">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Link href={companyProfileLink}>
                <Avatar>
                  <AvatarImage src={companyPhotoUrl} alt={job.companyName} />
                  <AvatarFallback>
                    <Building />
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link href={companyProfileLink} className="hover:underline">
                  <p className="font-bold">{job.companyName}</p>
                </Link>
                <p className="text-sm text-muted-foreground">
                  ha publicado una nueva vacante
                </p>
                <p className="text-xs text-muted-foreground">
                  {job.createdAt ? formatDistanceToNow(new Date(job.createdAt.seconds * 1000), { addSuffix: true, locale: es }) : ''}
                </p>
              </div>
            </div>
            {isAuthor && (
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowDeleteAlert(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Eliminar</span>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="font-bold font-headline text-lg mb-2">{job.title}</h3>
          <p className="whitespace-pre-wrap text-muted-foreground line-clamp-3">{job.description}</p>
          <div className="flex flex-wrap gap-2 mt-4">
              {job.location && <Badge variant="secondary" className="flex items-center gap-1"><MapPin size={12}/>{job.location}</Badge>}
              {job.jobType && <Badge variant="secondary" className="flex items-center gap-1"><Briefcase size={12}/>{job.jobType}</Badge>}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-2 pb-2 px-4 flex justify-end">
            <Button asChild>
              <Link href={`/jobs/${job.id}`}>Ver Vacante</Link>
            </Button>
        </CardFooter>
      </Card>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta vacante?</AlertDialogTitle>
              <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente la vacante de nuestros servidores.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Eliminar
              </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isEditing} onOpenChange={handleOpenChange}>
        <DialogContent>
            <DialogHeader><DialogTitle>Editar Vacante</DialogTitle></DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Título del Puesto</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción</FormLabel>
                                <FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar cambios
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
