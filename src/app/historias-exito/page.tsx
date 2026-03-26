"use client";
'use client';

import { useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Post } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function SuccessStoriesPage() {
    const firestore = useFirestore();

    const postsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: allPosts, loading, error } = useCollection<Post>(postsQuery);
    
    const posts = useMemo(() => {
        if (!allPosts) return null;
        return allPosts.filter(post => post.authorName && !post.authorName.includes("Universidad Central"));
    }, [allPosts]);

    const getInitials = (name: string = '') => {
        return name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || '';
    };

    const renderContent = () => {
         if (loading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            );
        }

        if (error) {
             return (
                 <Card className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-dashed">
                    <Trophy className="h-16 w-16 text-destructive mb-4" />
                    <h2 className="text-2xl font-bold font-headline text-destructive">
                        Error al cargar las historias
                    </h2>
                </Card>
            );
        }

        if (posts && posts.length > 0) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {posts.map(post => {
                        const imageUrl = post.authorPhotoUrl || post.imageUrl;
                        return (
                         <Card key={post.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                            <Link href={`/alumni/${post.authorId}`}>
                                <div className="flex flex-col sm:flex-row">
                                    <div className="sm:w-1/3 relative h-64 sm:h-auto">
                                        <Avatar className="h-full w-full rounded-none">
                                            <AvatarImage src={imageUrl} alt={post.authorName} className="object-cover" />
                                            <AvatarFallback className="text-5xl rounded-none bg-primary text-primary-foreground flex items-center justify-center">
                                                {getInitials(post.authorName)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="sm:w-2/3 flex flex-col">
                                        <CardHeader>
                                            <CardTitle className="font-headline text-2xl">{post.authorName}</CardTitle>
                                            <CardDescription>
                                                {post.authorCareer && <span className="font-semibold text-primary">{post.authorCareer}</span>}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-5">{post.content}</p>
                                        </CardContent>
                                    </div>
                                </div>
                            </Link>
                        </Card>
                    )})}
                </div>
            );
        }

        return (
            <Card className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-dashed">
                <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold font-headline text-muted-foreground">
                    Aún no hay historias de éxito publicadas
                </h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                    Estamos trabajando para traerte las historias más inspiradoras de nuestros graduados. ¡Vuelve pronto!
                </p>
            </Card>
        )
    };
    
    return (
        <div className="bg-background">
            <div className="container mx-auto py-12 px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl lg:text-5xl font-headline font-bold text-primary">Historias de Éxito</h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                        Descubre cómo los graduados de UCN están dejando su huella en diversas industrias y comunidades a través de sus propias palabras.
                    </p>
                </div>

                {renderContent()}
            </div>
        </div>
    );
}
