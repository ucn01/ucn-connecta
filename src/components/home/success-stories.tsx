"use client";
'use client';

import { useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Post } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Trophy } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function SuccessStories() {
    const firestore = useFirestore();

    const postsQuery = useMemo(() => {
        if (!firestore) return null;
        // Fetch the 3 most recent items from the 'posts' collection, ordered by creation date.
        return query(
            collection(firestore, 'posts'), 
            orderBy('createdAt', 'desc'),
            limit(3)
        );
    }, [firestore]);

    const { data: posts, loading, error } = useCollection<Post>(postsQuery);

    const filteredPosts = useMemo(() => {
        if (!posts) return null;
        return posts.filter(post => post.authorName && !post.authorName.includes("Universidad Central"));
    }, [posts]);

    const getInitials = (name: string = '') => {
        return name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || '';
    };
    
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            );
        }

        if (error) {
             return (
                <Card className="min-h-[200px] flex flex-col items-center justify-center text-center p-8 border-dashed bg-card">
                    <Trophy className="h-16 w-16 text-destructive mb-4" />
                    <h2 className="text-2xl font-bold font-headline text-destructive">
                        Error al cargar historias
                    </h2>
                </Card>
            );
        }

        if (filteredPosts && filteredPosts.length > 0) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.map(post => (
                        <Card key={post.id} className="flex flex-col shadow-md hover:shadow-xl transition-shadow duration-300">
                            <CardHeader className="p-0">
                                <div className="relative h-56 w-full">
                                    <Link href={`/alumni/${post.authorId}`} className="block h-full w-full">
                                        <Avatar className="h-full w-full rounded-b-none rounded-t-lg">
                                            <AvatarImage src={post.authorPhotoUrl || post.imageUrl} alt={post.authorName} className="object-cover"/>
                                            <AvatarFallback className="text-5xl rounded-b-none rounded-t-lg">{getInitials(post.authorName)}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col flex-grow">
                                <h3 className="font-headline text-xl font-bold">{post.authorName}</h3>
                                {post.authorCareer && <p className="text-primary font-medium">{post.authorCareer}</p>}
                                <p className="text-sm text-muted-foreground mt-1">
                                    {post.createdAt ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true, locale: es }) : ''}
                                </p>
                                <p className="mt-4 text-sm text-muted-foreground line-clamp-4 flex-grow">
                                    {post.content}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
        }

        return (
            <Card className="min-h-[200px] flex flex-col items-center justify-center text-center p-8 border-dashed bg-card">
                <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold font-headline text-muted-foreground">
                    Aún no hay historias de éxito publicadas
                </h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                    ¡Sé el primero en compartir tu historia en el feed de la comunidad!
                </p>
            </Card>
        );
    };


    return (
        <section className="py-16 sm:py-24 bg-muted/40">
            <div className="container">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="font-headline text-3xl sm:text-4xl font-bold">Historias de Éxito UCN</h2>
                    <p className="mt-3 text-lg text-muted-foreground">
                        Conoce las trayectorias inspiradoras de nuestros graduados y el impacto que están generando en el mundo.
                    </p>
                </div>

                <div className="mt-12">
                   {renderContent()}
                </div>

                <div className="mt-12 text-center">
                    <Button size="lg" asChild>
                        <Link href="/historias-exito">
                            Ver más historias de éxito
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
