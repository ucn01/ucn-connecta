'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, query, where, doc, updateDoc, Query, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { User as UserType } from '@/lib/types';
import { format } from 'date-fns';

import { Loader2, CheckCircle, XCircle, Trash2, Users as UsersIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type User = UserType;

type UserStatus = 'pending' | 'approved' | 'rejected' | 'deleted';
const STATUS_MAP: Record<UserStatus, string> = {
  pending: 'Pendientes',
  approved: 'Aprobados',
  rejected: 'Rechazados',
  deleted: 'Eliminados',
};

export default function AdminPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [isMigrating, setIsMigrating] = useState(false);

  // State for delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);


  const currentStatus = (searchParams.get('status') as UserStatus) || 'pending';

  // --- Data Fetching ---
  const graduateQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'graduate'),
      where('status', '==', currentStatus)
    ) as Query<User>;
  }, [firestore, currentStatus]);

  const companyQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'company'),
      where('status', '==', currentStatus)
    ) as Query<User>;
  }, [firestore, currentStatus]);

  const { data: graduates, loading: graduatesLoading } = useCollection<User>(graduateQuery);
  const { data: companies, loading: companiesLoading } = useCollection<User>(companyQuery);
  
  const handleMigration = async () => {
    if (!firestore) return;
    setIsMigrating(true);
    try {
        const usersRef = collection(firestore, 'users');
        const querySnapshot = await getDocs(usersRef);
        const batch = writeBatch(firestore);
        let updatedCount = 0;
        
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            // This will approve any user without a status field
            if (!userData.status) {
                const userRef = doc.ref;
                batch.update(userRef, { status: 'approved' });
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            await batch.commit();
            toast({
                title: 'Migración completada',
                description: `${updatedCount} usuarios antiguos han sido actualizados al estado 'Aprobado'.`,
            });
        } else {
             toast({
                title: 'No hay usuarios para migrar',
                description: 'Todos los usuarios ya tienen un estado asignado.',
            });
        }

    } catch (error) {
        console.error("Migration error:", error);
        toast({ variant: 'destructive', title: 'Error en la migración', description: 'No se pudieron actualizar los usuarios.' });
    } finally {
        setIsMigrating(false);
    }
  };

  // --- Handlers ---
  const handleUpdateStatus = async (userId: string, newStatus: UserStatus) => {
    if (!firestore) return;
    setUpdatingId(userId);
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, { status: newStatus });
      toast({
        title: 'Éxito',
        description: `Usuario actualizado a estado '${STATUS_MAP[newStatus]}'.`
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el estado del usuario.'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteReason('');
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!firestore || !userToDelete) return;
    if (!deleteReason.trim()) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'La razón de eliminación es obligatoria.'
        });
        return;
    }

    setIsDeleting(true);
    try {
        const userRef = doc(firestore, 'users', userToDelete.uid);
        await updateDoc(userRef, {
            status: 'deleted',
            deleteReason: deleteReason,
            deletedAt: serverTimestamp()
        });
        toast({
            title: 'Usuario Eliminado',
            description: `El usuario ${userToDelete.fullName || userToDelete.companyName} ha sido marcado como eliminado.`
        });
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
    } catch (error) {
        console.error("Error deleting user:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo eliminar el usuario.'
        });
    } finally {
        setIsDeleting(false);
    }
  };

  // --- Render Logic ---
  if (userLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (user.role !== 'admin') {
    router.replace('/dashboard');
    return null;
  }

  const renderActionButtons = (user: User) => {
    if (updatingId === user.uid) {
        return <Loader2 className="animate-spin inline-block" />;
    }
    switch (currentStatus) {
        case 'pending':
            return <>
                <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => handleUpdateStatus(user.uid, 'approved')}><CheckCircle className="mr-1" />Aprobar</Button>
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleUpdateStatus(user.uid, 'rejected')}><XCircle className="mr-1" />Rechazar</Button>
            </>;
        case 'approved':
            return <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => openDeleteDialog(user)}><Trash2 className="mr-1" />Eliminar</Button>
        case 'rejected':
            return <>
                <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => handleUpdateStatus(user.uid, 'approved')}><CheckCircle className="mr-1" />Aprobar</Button>
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => openDeleteDialog(user)}><Trash2 className="mr-1" />Eliminar</Button>
            </>;
        case 'deleted':
            return null;
        default: return null;
    }
  };

  const renderTable = (users: User[] | null, loading: boolean, role: 'graduate' | 'company') => {
    if (loading) {
        return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;
    }
    if (!users || users.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No hay usuarios en esta categoría.</p>;
    }
    
    if (currentStatus === 'deleted') {
      return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{role === 'graduate' ? 'Graduado' : 'Empresa'}</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Razón de Eliminación</TableHead>
                    <TableHead className="text-right">Fecha de Eliminación</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map(u => (
                    <TableRow key={u.uid}>
                        <TableCell className="font-medium">{role === 'graduate' ? u.fullName : u.companyName}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.deleteReason}</TableCell>
                        <TableCell className="text-right">{u.deletedAt ? format(u.deletedAt.toDate(), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {role === 'graduate' ? <>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Carrera</TableHead>
                        <TableHead>Cédula</TableHead>
                    </> : <>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Correo RRHH</TableHead>
                        <TableHead>Teléfono RRHH</TableHead>
                    </>}
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map(u => (
                    <TableRow key={u.uid}>
                        {role === 'graduate' ? <>
                            <TableCell className="font-medium">{u.fullName}</TableCell>
                            <TableCell>{u.career}</TableCell>
                            <TableCell>{u.idNumber}</TableCell>
                        </> : <>
                            <TableCell className="font-medium">{u.companyName}</TableCell>
                            <TableCell>{u.hrManagerEmail}</TableCell>
                            <TableCell>{u.hrManagerPhone}</TableCell>
                        </>}
                        <TableCell>{u.createdAt ? format(u.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-2">
                           {renderActionButtons(u)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Mostrando usuarios: {STATUS_MAP[currentStatus]}</p>
        </div>
        <div>
            <Button onClick={handleMigration} disabled={isMigrating} variant="outline">
                {isMigrating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <UsersIcon className="mr-2 h-4 w-4" />
                )}
                Aprobar Usuarios Antiguos
            </Button>
        </div>
      </div>

       <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Graduados</CardTitle>
            </CardHeader>
            <CardContent>
                {renderTable(graduates, graduatesLoading, 'graduate')}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Empresas</CardTitle>
            </CardHeader>
            <CardContent>
                {renderTable(companies, companiesLoading, 'company')}
            </CardContent>
        </Card>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>¿Seguro que quieres eliminar a {userToDelete?.fullName || userToDelete?.companyName}?</DialogTitle>
                <DialogDescription>
                    Esta acción marcará al usuario como eliminado. Esta acción no se puede deshacer.
                    Para confirmar, por favor, introduce la razón de la eliminación.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="deleteReason" className="sr-only">Razón de la eliminación</Label>
                <Textarea
                    id="deleteReason"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Introduce la razón aquí..."
                />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting || !deleteReason.trim()}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2" />}
                    Confirmar Eliminación
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
