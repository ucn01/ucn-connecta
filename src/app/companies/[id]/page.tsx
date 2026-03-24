'use client';
import { useMemo, useState, useEffect } from 'react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useUser } from '@/firebase';
import { doc, collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import type { User, Job, Post } from '@/lib/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Briefcase,
  MapPin,
  Mail,
  Edit,
  Share2,
  Users,
  Globe,
  PlusCircle,
  Building,
  Calendar,
  Users2,
  Phone,
  Sparkles,
  Award,
  GraduationCap,
  User as UserIcon,
  MessageSquareText,
  FileText
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PostCard } from '@/components/feed/PostCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function InfoPill({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | React.ReactNode }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <div className="text-muted-foreground mt-1">{icon}</div>
            <div>
                <p className="font-semibold">{label}</p>
                <div className="text-muted-foreground text-sm">{value}</div>
            </div>
        </div>
    );
}

export default function CompanyProfilePage() {
  const { id } = useParams();
  const firestore = useFirestore();
  const { user: currentUser, loading: userLoading } = useUser();
  
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState<string | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(true);

  const userDocRef = useMemo(() => {
    if (!firestore || !id || typeof id !== 'string') return null;
    return doc(firestore, 'users', id);
  }, [firestore, id]);
  const { data: company, loading: companyLoading } = useDoc<User>(userDocRef);
  
  const jobsQuery = useMemo(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'jobs'), where('companyId', '==', id));
  }, [firestore, id]);
  const { data: unsortedJobs, loading: jobsLoading } = useCollection<Job>(jobsQuery);
  const jobs = useMemo(() => unsortedJobs ? [...unsortedJobs].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)) : null, [unsortedJobs]);

  const postsQuery = useMemo(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'posts'), where('authorId', '==', id));
  }, [firestore, id]);
  const { data: unsortedPosts, loading: postsLoading } = useCollection<Post>(postsQuery);
  const posts = useMemo(() => unsortedPosts ? [...unsortedPosts].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)) : null, [unsortedPosts]);

  const isOwnProfile = currentUser?.uid === id;

  // Get followers count
  useEffect(() => {
    if (!firestore || !id) return;
    const q = query(collection(firestore, 'follows'), where('followingId', '==', id));
    const unsubscribe = onSnapshot(q, (snapshot) => setFollowersCount(snapshot.size));
    return () => unsubscribe();
  }, [firestore, id]);
  
  // Check if current user is following this profile
  useEffect(() => {
    if (!firestore || !currentUser || isOwnProfile) {
      setIsFollowLoading(false);
      return;
    }
    setIsFollowLoading(true);
    const q = query(
      collection(firestore, 'follows'),
      where('followerId', '==', currentUser.uid),
      where('followingId', '==', id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setIsFollowing(true);
        setFollowDocId(snapshot.docs[0].id);
      } else {
        setIsFollowing(false);
        setFollowDocId(null);
      }
      setIsFollowLoading(false);
    });
    return () => unsubscribe();
  }, [firestore, currentUser, id, isOwnProfile]);

  const handleFollowToggle = async () => {
    if (isFollowLoading || !firestore || !currentUser || isOwnProfile) return;
    setIsFollowLoading(true);

    if (isFollowing && followDocId) {
      await deleteDoc(doc(firestore, 'follows', followDocId));
    } else {
      await addDoc(collection(firestore, 'follows'), {
        followerId: currentUser.uid,
        followingId: id,
        createdAt: serverTimestamp(),
      });
    }
  };

  const loading = userLoading || companyLoading;

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!company || company.role !== 'company') {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold">Empresa no encontrada</h1>
        <p className="text-muted-foreground">El perfil que buscas no existe o no es una empresa válida.</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/40 py-8">
      <div className="container mx-auto max-w-5xl px-4">
        <Card className="overflow-hidden mb-6">
          <div className="relative">
            <div className="h-56 w-full bg-gradient-to-r from-primary to-accent" />
            <div className="absolute top-full left-6 -translate-y-1/2">
              <Avatar className="h-32 w-32 border-4 border-card bg-card">
                <AvatarImage src={company.photoUrl} alt={company.companyName} />
                <AvatarFallback className="text-4xl"><Building /></AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="pt-20 p-6 space-y-1">
            <div className="flex justify-end gap-2">
                {!isOwnProfile && currentUser && (
                    <Button onClick={handleFollowToggle} disabled={isFollowLoading} variant={isFollowing ? 'outline' : 'default'}>
                        {isFollowLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        {isFollowing ? 'Siguiendo' : 'Seguir'}
                    </Button>
                )}
                {isOwnProfile && (<Button asChild variant="outline"><Link href="/my-profile"><Edit className="mr-2 h-4 w-4"/>Editar Perfil</Link></Button>)}
                 <Button variant="outline"><Share2 className="mr-2 h-4 w-4" />Compartir</Button>
            </div>

            <h1 className="text-3xl font-bold font-headline">{company.companyName}</h1>
            <p className="text-lg text-muted-foreground">{company.companySector}</p>
            <p className="text-sm text-muted-foreground max-w-2xl">{company.companyDescription || 'Empresa de la red UCN Connecta.'}</p>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
                {company.companyLocation && ( <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> <span>{company.companyLocation}</span></div>)}
                {company.companyWebsite && ( <div className="flex items-center gap-2"><Globe className="h-4 w-4" /> <a href={company.companyWebsite} target="_blank" rel="noreferrer" className="hover:underline">{company.companyWebsite}</a></div>)}
                 <div className="flex items-center gap-1"><span className="font-bold text-foreground">{jobs?.length || 0}</span><span className="text-muted-foreground">Vacantes</span></div>
                <div className="flex items-center gap-1"><span className="font-bold text-foreground">{posts?.length || 0}</span><span className="text-muted-foreground">Publicaciones</span></div>
                <div className="flex items-center gap-1"><span className="font-bold text-foreground">{followersCount}</span><span className="text-muted-foreground">Seguidores</span></div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                 <Tabs defaultValue="jobs" className="w-full">
                    <Card className="rounded-b-none">
                        <TabsList className="w-full justify-start rounded-none border-b bg-card p-0 px-6">
                            <TabsTrigger value="jobs"><Briefcase className="mr-2"/>Vacantes</TabsTrigger>
                            <TabsTrigger value="posts"><FileText className="mr-2"/>Publicaciones</TabsTrigger>
                            <TabsTrigger value="about"><Building className="mr-2"/>Acerca de</TabsTrigger>
                        </TabsList>
                    </Card>
                    
                    <Card className="rounded-t-none border-t-0">
                        <TabsContent value="jobs" className="p-6 m-0 space-y-4">
                            {isOwnProfile && <div className="flex justify-end"><Button asChild><Link href="/jobs/create">Publicar Vacante</Link></Button></div>}
                            {jobsLoading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            : jobs && jobs.length > 0 ? jobs.map((job) => (
                                <Card key={job.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{job.title}</CardTitle>
                                                <CardDescription>
                                                    {job.location && <span className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3" /> {job.location}</span>}
                                                </CardDescription>
                                            </div>
                                            {job.jobType && <Badge variant="secondary">{job.jobType}</Badge>}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{job.description}</p>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="secondary" asChild><Link href={`/jobs/${job.id}`}>Ver vacante</Link></Button>
                                            <Button size="sm">Postularme</Button>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="text-xs text-muted-foreground justify-between">
                                        <span>Publicado: {job.createdAt ? format(new Date(job.createdAt.seconds * 1000), 'd MMMM, yyyy', { locale: es }) : 'N/A'}</span>
                                        {job.applicationDeadline && <span>Fecha límite: {format(new Date(job.applicationDeadline.seconds * 1000), 'd MMMM, yyyy', { locale: es })}</span>}
                                    </CardFooter>
                                </Card>
                            ))
                            : <p className="text-sm text-muted-foreground text-center py-8">Actualmente no hay vacantes publicadas en esta empresa.</p>}
                        </TabsContent>
                        <TabsContent value="posts" className="p-0 m-0">
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
                                          Esta empresa aún no ha publicado contenido
                                      </h2>
                                  </div>
                              )}
                           </div>
                        </TabsContent>
                        <TabsContent value="about" className="p-6 m-0 space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2 text-lg">Descripción</h3>
                                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{company.companyDescription || 'No hay una descripción detallada disponible.'}</p>
                            </div>
                             <Separator />
                             <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" /> Cultura</h3>
                                <p className="text-sm text-muted-foreground">{company.companyCulture || 'Información no disponible.'}</p>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2 text-lg"><Award className="h-5 w-5 text-primary" /> Beneficios</h3>
                                <p className="text-sm text-muted-foreground">{company.employeeBenefits || 'Información no disponible.'}</p>
                            </div>
                        </TabsContent>
                    </Card>
                </Tabs>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <InfoPill icon={<Briefcase size={16}/>} label="Sector" value={company.companySector} />
                        <InfoPill icon={<Users2 size={16}/>} label="Tamaño" value={company.companySize} />
                        <InfoPill icon={<MapPin size={16}/>} label="Sede" value={company.companyLocation} />
                        <InfoPill icon={<Calendar size={16}/>} label="Año de fundación" value={company.yearFounded} />
                        <InfoPill icon={<Globe size={16}/>} label="Sitio Web" value={company.companyWebsite ? <a href={company.companyWebsite} className="text-primary hover:underline" target='_blank' rel="noreferrer">{company.companyWebsite}</a> : undefined} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap size={20} /> Graduados UCN</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Actualmente, <span className="font-bold text-foreground">0</span> graduados de UCN trabajan en esta empresa.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Contacto RRHH</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                       <InfoPill icon={<UserIcon size={16}/>} label="Responsable" value={company.hrManagerName} />
                       <InfoPill icon={<Mail size={16}/>} label="Email" value={company.hrManagerEmail} />
                       <InfoPill icon={<Phone size={16}/>} label="Teléfono" value={company.hrManagerPhone} />
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
