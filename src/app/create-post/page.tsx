"use client";
;

import { CreatePost } from '@/components/feed/CreatePost';
import { useUser } from '@/firebase';

export default function CreatePostPage() {
    const { user } = useUser();

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold font-headline mb-6">
                Crear una publicación
            </h1>
            {user && <CreatePost user={user} />}
        </div>
    );
}
