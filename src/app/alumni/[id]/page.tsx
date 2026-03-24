'use client';
import { useMemo, useState, useEffect } from 'react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useUser } from '@/firebase';
import { doc, collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import type { User, Post } from '@/lib/types';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/feed/PostCard';

import {
  Loader2,
  GraduationCap,
  Briefcase,
  MapPin,
  Mail,
  Edit,
  Share2,
  CalendarDays,
  Users,
  FileText,
  MessageSquareText,
} from 'lucide-react';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';

export default function AlumniProfilePage() {
  const { id } = useParams();
  const firestore = useFirestore();
  const { user: currentUser, loading: userLoading } = useUser();
  
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState<string | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(true);

  const userDocRef = useMemo(() => {
    if (!firestore || !id || typeof id !== 'string') return null;
    return doc(firestore, 'users', id);
  }, [firestore, id]);
  const { data: graduate, loading: graduateLoading } = useDoc<User>(userDocRef);

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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFollowersCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [firestore, id]);

  // Get following count
  useEffect(() => {
    if (!firestore || !id) return;
    const q = query(collection(firestore, 'follows'), where('followerId', '==', id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFollowingCount(snapshot.size);
    });
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
      // Unfollow
      await deleteDoc(doc(firestore, 'follows', followDocId));
    } else {
      // Follow
      await addDoc(collection(firestore, 'follows'), {
        followerId: currentUser.uid,
        followingId: id,
        createdAt: serverTimestamp(),
      });
    }
  };

  const loading = userLoading || graduateLoading;

  const getInitials = (name: string = '') => {
    return name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!graduate) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold">Graduado no encontrado</h1>
        <p className="text-muted-foreground">El perfil que buscas no existe o no está disponible.</p>
      </div>
    );
  }

  if (graduate.role !== 'graduate') {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">Este perfil no es de un graduado válido.</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/40 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <Card className="overflow-hidden">
          <div className="relative">
            <div className="h-60 w-full bg-gradient-to-r from-primary to-accent" />
            <div className="absolute top-full left-6 -translate-y-1/2">
              <Avatar className="h-32 w-32 border-4 border-card">
                <AvatarImage src={graduate.photoUrl} alt={graduate.fullName} />
                <AvatarFallback className="text-4xl">{getInitials(graduate.fullName)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute top-6 right-6 flex gap-2">
                <Button variant="secondary"><Share2 className="mr-2" />Compartir</Button>
            </div>
          </div>

          <div className="pt-20 p-6 space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{graduate.fullName}</h1>
                    <p className="text-lg text-primary">{graduate.career}</p>
                </div>
                <div className="flex items-center gap-2">
                    {isOwnProfile && (
                        <Button asChild variant="secondary">
                            <Link href="/my-profile"><Edit className="mr-2"/>Editar Perfil</Link>
                        </Button>
                    )}
                    {!isOwnProfile && currentUser && (
                        <Button onClick={handleFollowToggle} disabled={isFollowLoading} variant={isFollowing ? 'outline' : 'default'}>
                            {isFollowLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isFollowing ? 'Siguiendo' : 'Seguir'}
                        </Button>
                    )}
                </div>
            </div>

            <div className="text-muted-foreground space-y-2">
                {graduate.profileDescription ? (
                    <p className="italic">{graduate.profileDescription}</p>
                ) : (
                    <p className="italic">Graduado de la Universidad Central de Nicaragua comprometido con el desarrollo profesional y el crecimiento de la comunidad UCN.</p>
                )}
                 <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                    {graduate.workplace && (
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" /> <span>{graduate.workplace}</span>
                        </div>
                    )}
                    {graduate.campus && (
                         <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> <span>Sede {graduate.campus}</span>
                        </div>
                    )}
                    {graduate.graduationYear && (
                         <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" /> <span>Promoción {graduate.graduationYear}</span>
                        </div>
                    )}
                     {graduate.email && (
                         <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" /> <span>{graduate.email}</span>
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
                 {isOwnProfile && currentUser && (
                    <div className="p-6 border-b flex justify-end">
                      <CreatePostDialog user={currentUser} />
                    </div>
                  )}
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
                                {isOwnProfile ? 'Aún no tienes publicaciones' : 'Este graduado aún no ha publicado contenido'}
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
