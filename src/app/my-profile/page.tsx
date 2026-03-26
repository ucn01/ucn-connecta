"use client";
'use client';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Mail, MapPin, CalendarDays, Edit, Share2, Users, FileText, MessageSquareText, GraduationCap, AlertTriangle, CheckCircle, Clock, Globe, Briefcase, Building, PlusCircle, Upload } from 'lucide-react';
import type { User, Post, Job } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useFirebaseApp } from '@/firebase';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/feed/PostCard';
import { useCollection } from '@/firebase/firestore/use-collection';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';
import { companySectors } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

const profileSchema = z.object({
  // Graduate
  fullName: z.string().optional(),
  career: z.string().optional(),
  workplace: z.string().optional(),
  profileDescription: z.string().optional(),
  
  // Company
  companyName: z.string().optional(),
  companySector: z.string().optional(),
  companyLocation: z.string().optional(),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  companyDescription: z.string().optional(),
  companySize: z.string().optional(),
  yearFounded: z.coerce.number().optional(),
  companyCulture: z.string().optional(),
  employeeBenefits: z.string().optional(),

  // Common for upload
  photoFile: z.any()
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE,
      `El tamaño máximo es 5MB.`
    )
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
      "Solo se aceptan formatos .jpg, .jpeg, .png, .webp y .gif"
    ),
});


export default function MyProfilePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const postsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'posts'), where('authorId', '==', user.uid));
  }, [firestore, user]);
  const { data: unsortedPosts, loading: postsLoading } = useCollection<Post>(postsQuery);
  const posts = useMemo(() => unsortedPosts ? [...unsortedPosts].sort((a,b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)) : null, [unsortedPosts]);
  
  const jobsQuery = useMemo(() => {
    if (!firestore || !user || user.role !== 'company') return null;
    return query(collection(firestore, 'jobs'), where('companyId', '==', user.uid));
  }, [firestore, user]);
  const { data: unsortedJobs, loading: jobsLoading } = useCollection<Job>(jobsQuery);
  const jobs = useMemo(() => unsortedJobs ? [...unsortedJobs].sort((a,b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)) : null, [unsortedJobs]);


  // Get followers count
  useEffect(() => {
    if (!firestore || !user) return;
    const q = query(collection(firestore, 'follows'), where('followingId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFollowersCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [firestore, user]);

  // Get following count
  useEffect(() => {
    if (!firestore || !user) return;
    const q = query(collection(firestore, 'follows'), where('followerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFollowingCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [firestore, user]);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        fullName: user?.fullName || '',
        career: user?.career || '',
        workplace: user?.workplace || '',
        profileDescription: user?.profileDescription || '',
        companyName: user?.companyName || '',
        companySector: user?.companySector || '',
        companyLocation: user?.companyLocation || '',
        companyWebsite: user?.companyWebsite || '',
        companyDescription: user?.companyDescription || '',
        companySize: user?.companySize || '',
        yearFounded: user?.yearFounded || undefined,
        companyCulture: user?.companyCulture || '',
        employeeBenefits: user?.employeeBenefits || '',
        photoFile: undefined,
    }
  });

  useEffect(() => {
    if (user) {
        form.reset({
            fullName: user.fullName || '',
            career: user.career || '',
            workplace: user.workplace || '',
            profileDescription: user.profileDescription || '',
            companyName: user.companyName || '',
            companySector: user.companySector || '',
            companyLocation: user.companyLocation || '',
            companyWebsite: user.companyWebsite || '',
            companyDescription: user.companyDescription || '',
            companySize: user.companySize || '',
            yearFounded: user.yearFounded || undefined,
            companyCulture: user.companyCulture || '',
            employeeBenefits: user.employeeBenefits || '',
            photoFile: undefined,
        });
    }
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user || !firestore || !app) return;
    setIsSaving(true);
    try {
        let updatedPhotoUrl = user.photoUrl; // Keep existing photo if no new one is uploaded
        const photoFile = values.photoFile?.[0];

        if (photoFile) {
            const storage = getStorage(app);
            const fileExtension = photoFile.name.split('.').pop();
            const storageRef = ref(storage, `profile-pictures/${user.uid}.${fileExtension}`);
            const uploadResult = await uploadBytes(storageRef, photoFile);
            updatedPhotoUrl = await getDownloadURL(uploadResult.ref);
        }

        const userRef = doc(firestore, 'users', user.uid);
        const dataToUpdate = user.role === 'graduate' ? {
            fullName: values.fullName,
            career: values.career,
            workplace: values.workplace,
            photoUrl: updatedPhotoUrl,
            profileDescription: values.profileDescription,
        } : {
            companyName: values.companyName,
            photoUrl: updatedPhotoUrl,
            companySector: values.companySector,
            companyLocation: values.companyLocation,
            companyWebsite: values.companyWebsite,
            companyDescription: values.companyDescription,
            companySize: values.companySize,
            yearFounded: values.yearFounded,
            companyCulture: values.companyCulture,
            employeeBenefits: values.employeeBenefits,
        };
        await updateDoc(userRef, dataToUpdate);
        toast({ title: "Perfil actualizado" });
        setIsEditing(false);
        setPhotoPreview(null);
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Error al actualizar" });
    } finally {
        setIsSaving(false);
    }
  };

  if (userLoading) {
    return <div className="container mx-auto max-w-4xl py-8 px-4 flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!user) {
    router.replace('/');
    return null;
  }
  
  const getInitials = (name: string = '') => name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || '';

  const handleEditClick = () => {
      if(!user) return;
      form.reset({
        fullName: user.fullName || '',
        career: user.career || '',
        workplace: user.workplace || '',
        profileDescription: user.profileDescription || '',
        companyName: user.companyName || '',
        companySector: user.companySector || '',
        companyLocation: user.companyLocation || '',
        companyWebsite: user.companyWebsite || '',
        companyDescription: user.companyDescription || '',
        companySize: user.companySize || '',
        yearFounded: user.yearFounded || undefined,
        companyCulture: user.companyCulture || '',
        employeeBenefits: user.employeeBenefits || '',
        photoFile: undefined,
      });
      setPhotoPreview(user.photoUrl || null);
      setIsEditing(true);
  }

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPhotoPreview(null);
  }

  if (isEditing) {
     return (
        <div className="container mx-auto max-w-4xl py-8 px-4">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Editar Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="flex flex-col items-center gap-4">
                            <Avatar className="h-32 w-32 border-4 border-muted">
                                <AvatarImage src={photoPreview || user.photoUrl} alt="Vista previa del perfil" />
                                <AvatarFallback>{getInitials(user.fullName || user.companyName || '')}</AvatarFallback>
                            </Avatar>
                             <FormField
                                control={form.control}
                                name="photoFile"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="photo-upload" className={buttonVariants({ variant: 'outline' })}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Cambiar foto
                                    </FormLabel>
                                    <FormControl>
                                    <Input
                                        id="photo-upload"
                                        type="file"
                                        className="sr-only"
                                        accept="image/png, image/jpeg, image/webp, image/gif"
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        ref={field.ref}
                                        onChange={(e) => {
                                            field.onChange(e.target.files);
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const newPreview = URL.createObjectURL(file);
                                                if (photoPreview && photoPreview.startsWith('blob:')) {
                                                    URL.revokeObjectURL(photoPreview); // Clean up old blob url
                                                }
                                                setPhotoPreview(newPreview);
                                            }
                                        }}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>

                        {user.role === 'graduate' ? (
                            <>
                            <FormField control={form.control} name="fullName" render={({ field }) => (
                                <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="career" render={({ field }) => (
                                <FormItem><FormLabel>Carrera</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="workplace" render={({ field }) => (
                                <FormItem><FormLabel>Lugar de Trabajo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="profileDescription" render={({ field }) => (
                                <FormItem><FormLabel>Historia Profesional</FormLabel><FormControl><Textarea {...field} placeholder="Una breve descripción de tu trayectoria profesional..."/></FormControl><FormMessage /></FormItem>
                            )}/>
                            </>
                        ) : (
                             <>
                                <FormField control={form.control} name="companyName" render={({ field }) => (
                                    <FormItem><FormLabel>Nombre de la Empresa</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="companySector" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Sector</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Selecciona un sector" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {companySectors.map(sector => <SelectItem key={sector} value={sector}>{sector}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                                <div className="grid md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="companyLocation" render={({ field }) => (
                                    <FormItem><FormLabel>Ubicación</FormLabel><FormControl><Input placeholder="Ej: Managua, Nicaragua" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="companySize" render={({ field }) => (
                                    <FormItem><FormLabel>Tamaño de la empresa</FormLabel><FormControl><Input placeholder="Ej: 50-100 empleados" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="yearFounded" render={({ field }) => (
                                    <FormItem><FormLabel>Año de fundación</FormLabel><FormControl><Input type="number" placeholder="Ej: 2010" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="companyWebsite" render={({ field }) => (
                                    <FormItem><FormLabel>Sitio Web</FormLabel><FormControl><Input placeholder="https://miempresa.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                </div>
                                <FormField control={form.control} name="companyDescription" render={({ field }) => (
                                    <FormItem><FormLabel>Descripción de la Empresa</FormLabel><FormControl><Textarea {...field} placeholder="Describe tu empresa..." className="min-h-[120px]" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="companyCulture" render={({ field }) => (
                                    <FormItem><FormLabel>Cultura</FormLabel><FormControl><Textarea {...field} placeholder="Describe la cultura de tu empresa..."/></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="employeeBenefits" render={({ field }) => (
                                    <FormItem><FormLabel>Beneficios</FormLabel><FormControl><Textarea {...field} placeholder="Describe los beneficios para empleados..."/></FormControl><FormMessage /></FormItem>
                                )}/>
                            </>
                        )}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="ghost" type="button" onClick={handleCancelEdit}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </Form>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  if (user.role !== 'graduate') {
      return (
        <div className="bg-muted/40 py-8">
        <div className="container mx-auto max-w-4xl px-4">
            <Card className="overflow-hidden">
            <div className="relative">
                <div className="h-56 w-full bg-gradient-to-r from-primary to-accent" />
                <div className="absolute top-full left-6 -translate-y-1/2">
                <Avatar className="h-32 w-32 border-4 border-card bg-card">
                    <AvatarImage src={user.photoUrl} alt={user.companyName} />
                    <AvatarFallback className="text-4xl"><Building/></AvatarFallback>
                </Avatar>
                </div>
            </div>

            <div className="pt-20 p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold font-headline">{user.companyName}</h1>
                        <p className="text-lg text-primary">{user.companySector}</p>
                    </div>
                    <Button onClick={handleEditClick} variant="secondary"><Edit className="mr-2"/>Editar Perfil</Button>
                </div>

                <div className="text-foreground space-y-2">
                    {user.companyDescription ? (
                        <p className="italic">{user.companyDescription}</p>
                    ) : (
                        <p className="italic">Empresa de la red UCN Connecta.</p>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-muted-foreground">
                        {user.companyLocation && ( <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> <span>{user.companyLocation}</span></div>)}
                        {user.companyWebsite && ( <div className="flex items-center gap-2"><Globe className="h-4 w-4" /> <a href={user.companyWebsite} target="_blank" rel="noreferrer" className="hover:underline">{user.companyWebsite}</a></div>)}
                        {user.email && ( <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> <span>{user.email}</span></div>)}
                    </div>
                </div>

                <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-1"><span className="font-bold text-foreground">{jobs?.length || 0}</span><span className="text-muted-foreground">Vacantes</span></div>
                    <div className="flex items-center gap-1"><span className="font-bold text-foreground">{posts?.length || 0}</span><span className="text-muted-foreground">Publicaciones</span></div>
                    <div className="flex items-center gap-1"><span className="font-bold text-foreground">{followersCount}</span><span className="text-muted-foreground">Seguidores</span></div>
                </div>
            </div>
            
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b px-6">
                    <TabsTrigger value="posts"><FileText className="mr-2"/>Publicaciones</TabsTrigger>
                    <TabsTrigger value="jobs"><Briefcase className="mr-2"/>Vacantes</TabsTrigger>
                    <TabsTrigger value="media"><Users className="mr-2"/>Multimedia</TabsTrigger>
                </TabsList>
                <TabsContent value="posts" className="p-0">
                    <div className="p-6 border-b flex justify-end">
                        <CreatePostDialog user={user} />
                    </div>
                    <div className="space-y-0">
                        {postsLoading ? (<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : posts && posts.length > 0 ? ( posts.map((post, index) => (<div key={post.id} className={index !== 0 ? 'border-t' : ''}><PostCard post={post} /></div>))
                        ) : (<div className="min-h-[200px] flex flex-col items-center justify-center text-center p-8"><MessageSquareText className="h-12 w-12 text-muted-foreground mb-4" /><h2 className="text-xl font-bold font-headline text-muted-foreground">No hay publicaciones todavía</h2></div>)}
                    </div>
                </TabsContent>
                 <TabsContent value="jobs" className="p-6 space-y-4">
                    {jobsLoading ? (<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : jobs && jobs.length > 0 ? ( jobs.map((job) => (
                        <Card key={job.id}>
                           <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{job.title}</CardTitle>
                                        <CardDescription>{job.companyName}</CardDescription>
                                    </div>
                                    {job.jobType && <Badge variant="secondary">{job.jobType}</Badge>}
                                </div>
                            </CardHeader>
                            <CardContent><p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p></CardContent>
                            <CardFooter className="text-sm text-muted-foreground justify-between">
                                <span>Publicado: {job.createdAt ? format(new Date(job.createdAt.seconds * 1000), 'dd/MM/yyyy', { locale: es }) : ''}</span>
                                {job.applicationDeadline && <span>Límite: {format(new Date(job.applicationDeadline.seconds * 1000), 'dd/MM/yyyy', { locale: es })}</span>}
                            </CardFooter>
                        </Card>
                    ))
                    ) : (<div className="min-h-[200px] flex flex-col items-center justify-center text-center p-8 border rounded-lg border-dashed"><Briefcase className="h-12 w-12 text-muted-foreground mb-4" /><h2 className="text-xl font-bold font-headline text-muted-foreground">No hay vacantes publicadas</h2></div>)}
                </TabsContent>
                <TabsContent value="media" className="p-6">
                    <p className="text-center text-muted-foreground">Sección de multimedia en construcción.</p>
                </TabsContent>
            </Tabs>
            </Card>
        </div>
    </div>
      )
  }

  return (
    <div className="bg-muted/40 py-8">
        <div className="container mx-auto max-w-4xl px-4">
            <Card className="overflow-hidden">
            <div className="relative">
                <div className="h-56 w-full bg-gradient-to-r from-primary to-accent" />
                <div className="absolute top-full left-6 -translate-y-1/2">
                <Avatar className="h-32 w-32 border-4 border-card">
                    <AvatarImage src={user.photoUrl} alt={user.fullName} />
                    <AvatarFallback className="text-4xl">{getInitials(user.fullName)}</AvatarFallback>
                </Avatar>
                </div>
                <div className="absolute top-6 right-6 flex gap-2">
                    <Button variant="secondary"><Share2 className="mr-2" />Compartir</Button>
                </div>
            </div>

            <div className="pt-20 p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold font-headline">{user.fullName}</h1>
                        <p className="text-lg text-primary">{user.career}</p>
                    </div>
                    <Button onClick={handleEditClick} variant="secondary"><Edit className="mr-2"/>Editar Perfil</Button>
                </div>

                <div className="text-foreground space-y-2">
                    {user.profileDescription ? (
                        <p className="italic">{user.profileDescription}</p>
                    ) : (
                        <p className="italic">Graduado de la Universidad Central de Nicaragua comprometido con el desarrollo profesional y el crecimiento de la comunidad UCN.</p>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-muted-foreground">
                        {user.campus && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> <span>Sede {user.campus}</span>
                            </div>
                        )}
                        {user.graduationYear && (
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" /> <span>Promoción {user.graduationYear}</span>
                            </div>
                        )}
                        {user.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" /> <span>{user.email}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-foreground">{followingCount}</span>
                        <span className="text-muted-foreground">Seguidos</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-foreground">{posts?.length || 0}</span>
                        <span className="text-muted-foreground">Publicaciones</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-foreground">{followersCount}</span>
                        <span className="text-muted-foreground">Seguidores</span>
                    </div>
                </div>
            </div>
            
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b px-6">
                    <TabsTrigger value="posts"><FileText className="mr-2"/>Publicaciones</TabsTrigger>
                    <TabsTrigger value="achievements"><GraduationCap className="mr-2"/>Logros</TabsTrigger>
                    <TabsTrigger value="media"><Users className="mr-2"/>Multimedia</TabsTrigger>
                </TabsList>
                <TabsContent value="posts" className="p-0">
                    <div className="p-6 border-b flex justify-end">
                        <CreatePostDialog user={user} />
                    </div>
                    <div className="space-y-0">
                        {postsLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : posts && posts.length > 0 ? (
                        posts.map((post, index) => (
                            <div key={post.id} className={index !== 0 ? 'border-t' : ''}>
                                <PostCard post={post} />
                            </div>
                        ))
                        ) : (
                            <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-8">
                                <MessageSquareText className="h-12 w-12 text-muted-foreground mb-4" />
                                <h2 className="text-xl font-bold font-headline text-muted-foreground">
                                    No hay publicaciones todavía
                                </h2>
                            </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="achievements" className="p-6">
                    <p className="text-center text-muted-foreground">Sección de logros profesionales en construcción.</p>
                </TabsContent>
                <TabsContent value="media" className="p-6">
                    <p className="text-center text-muted-foreground">Sección de multimedia en construcción.</p>
                </TabsContent>
            </Tabs>
            </Card>
        </div>
    </div>
  );
}
