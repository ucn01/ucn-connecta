'use client';
import type { Post, Like, Comment, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button, buttonVariants } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Heart, MessageCircle, Share2, Loader2, Building, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, query, where, serverTimestamp, orderBy, updateDoc } from 'firebase/firestore';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
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
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface PostCardProps {
  post: Post;
}

function CommentItem({ comment }: { comment: Comment }) {
    const getInitials = (name: string = '') => name?.split(' ').map((n) => n[0]).join('') || '';
    const profileLink = `/alumni/${comment.userId}`; // Needs to be adapted if companies can comment too

    return (
        <div className="flex items-start gap-3">
            <Link href={profileLink}>
                <Avatar className="h-9 w-9">
                    <AvatarImage src={comment.authorPhotoUrl} alt={comment.authorName} />
                    <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
                </Avatar>
            </Link>
            <div className="bg-muted p-3 rounded-lg w-full">
                <div className="flex justify-between items-center">
                    <Link href={profileLink} className="hover:underline">
                        <p className="font-semibold text-sm">{comment.authorName}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                        {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt.seconds * 1000), { addSuffix: true, locale: es }) : ''}
                    </p>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{comment.text}</p>
            </div>
        </div>
    )
}

export function PostCard({ post }: PostCardProps) {
  const getInitials = (name: string = '') => name?.split(' ').map((n) => n[0]).join('') || '';
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const isAuthor = currentUser?.uid === post.authorId;

  const editSchema = z.object({
    content: z.string().min(1, 'El contenido no puede estar vacío.').max(1000, 'El post es demasiado largo.'),
  });

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    values: {
      content: post.content,
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (open) {
      form.reset({ content: post.content });
    }
    setIsEditing(open);
  }

  const handleEditSubmit = async (values: z.infer<typeof editSchema>) => {
    if (!firestore || !isAuthor) return;
    setIsSaving(true);
    try {
      const postRef = doc(firestore, 'posts', post.id);
      await updateDoc(postRef, {
        content: values.content,
      });
      toast({ title: "Publicación actualizada" });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
      toast({ variant: 'destructive', title: "Error al actualizar" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Likes ---
  const likesQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'likes'), where('postId', '==', post.id)) : null
  , [firestore, post.id]);
  
  const { data: likes } = useCollection<Like>(likesQuery);

  const currentUserLike = useMemo(() => 
    likes?.find(like => like.userId === currentUser?.uid)
  , [likes, currentUser]);
  
  const hasLiked = !!currentUserLike;

  const handleLikeToggle = async () => {
    if (!firestore || !currentUser) return;
    
    if (hasLiked && currentUserLike) {
      const likeDoc = doc(firestore, 'likes', currentUserLike.id);
      await deleteDoc(likeDoc);
    } else {
      await addDoc(collection(firestore, 'likes'), {
        postId: post.id,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
    }
  };

  // --- Comments ---
  const commentsQuery = useMemo(() =>
    firestore ? query(collection(firestore, 'comments'), where('postId', '==', post.id), orderBy('createdAt', 'asc')) : null
  , [firestore, post.id]);

  const { data: comments, loading: commentsLoading } = useCollection<Comment>(commentsQuery);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !currentUser || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
        const authorName = currentUser.role === 'graduate' ? currentUser.fullName : currentUser.companyName;
        await addDoc(collection(firestore, 'comments'), {
            postId: post.id,
            userId: currentUser.uid,
            authorName: authorName,
            authorPhotoUrl: currentUser.photoUrl,
            text: newComment,
            createdAt: serverTimestamp(),
        });
        setNewComment('');
        setShowComments(true);
    } catch (error) {
        console.error("Error submitting comment:", error);
    } finally {
        setIsSubmittingComment(false);
    }
  };
  
  const getCommenterInitials = (user: User) => {
    const name = user.role === 'graduate' ? user.fullName : user.companyName;
    return getInitials(name);
  }
  
  const handleDelete = async () => {
    if (!firestore || !isAuthor) return;
    setIsDeleting(true);
    try {
        await deleteDoc(doc(firestore, 'posts', post.id));
        toast({ title: "Publicación eliminada" });
    } catch (error) {
        console.error("Error deleting post:", error);
        toast({ variant: 'destructive', title: "Error al eliminar" });
    } finally {
        setIsDeleting(false);
        setShowDeleteAlert(false);
    }
  }

  const profileLink = post.authorRole === 'graduate' ? `/alumni/${post.authorId}` : `/companies/${post.authorId}`;

  return (
    <>
      <Card className="shadow-none rounded-none">
        <CardHeader>
          <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
              <Link href={profileLink}>
                  <Avatar>
                  <AvatarImage src={post.authorPhotoUrl} alt={post.authorName} />
                  <AvatarFallback>
                      {post.authorRole === 'company' ? <Building /> : getInitials(post.authorName)}
                  </AvatarFallback>
                  </Avatar>
              </Link>
              <div>
                  <Link href={profileLink} className="hover:underline">
                  <p className="font-bold">{post.authorName}</p>
                  </Link>
                  {post.authorRole === 'graduate' && (
                      <p className="text-sm text-muted-foreground">
                          {post.authorCareer} &middot; Sede {post.authorCampus}
                      </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                  {post.createdAt ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true, locale: es }) : ''}
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
          <p className="whitespace-pre-wrap">{post.content}</p>
          {post.imageUrl && (
              <div className="mt-4 rounded-lg overflow-hidden border">
                  <img src={post.imageUrl} alt="Post content" className="w-full" />
              </div>
          )}
        </CardContent>
        {(likes && likes.length > 0 || comments && comments.length > 0) && (
          <div className="px-6 pb-2 flex justify-between items-center text-sm text-muted-foreground">
              {likes && likes.length > 0 && (
                  <span>{likes.length} Me gusta</span>
              )}
              {comments && comments.length > 0 && (
                 <span onClick={() => setShowComments(!showComments)} className="cursor-pointer hover:underline">
                    {comments.length} Comentarios
                </span>
              )}
          </div>
        )}
        <CardFooter className="border-t pt-2 pb-2 px-4 flex justify-between">
            <Button variant="ghost" size="sm" onClick={handleLikeToggle} disabled={!currentUser} className={cn("text-muted-foreground w-full", hasLiked && "text-primary font-bold")}>
              <Heart className={cn("mr-2", hasLiked && "fill-current text-primary")} />
              Me gusta
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)} disabled={!currentUser} className="text-muted-foreground w-full">
              <MessageCircle className="mr-2" />
              Comentar
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground w-full">
              <Share2 className="mr-2" />
              Compartir
            </Button>
        </CardFooter>
        {showComments && (
          <div className="p-4 border-t">
              {currentUser && (
                 <form onSubmit={handleCommentSubmit} className="flex items-start gap-2 mb-4">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={currentUser.photoUrl} />
                        <AvatarFallback>{getCommenterInitials(currentUser)}</AvatarFallback>
                    </Avatar>
                    <Textarea 
                        placeholder="Escribe un comentario..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[40px] resize-none"
                        rows={1}
                    />
                    <Button type="submit" size="sm" disabled={isSubmittingComment || !newComment.trim()}>
                        {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Enviar'}
                    </Button>
                </form>
            )}
            <div className="space-y-4">
                {commentsLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : comments && comments.length > 0 ? (
                    comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">No hay comentarios todavía.</p>
                )}
            </div>
        </div>
      )}
      </Card>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta publicación?</AlertDialogTitle>
              <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente tu publicación de nuestros servidores.
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
            <DialogHeader>
                <DialogTitle>Editar Publicación</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleEditSubmit)}>
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea className="min-h-[150px]" {...field} />
                                </FormControl>
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
