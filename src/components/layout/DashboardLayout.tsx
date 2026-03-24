'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';
import { Home, User, Newspaper, LogOut, Users, Building, Briefcase, Trophy, Shield, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '../ui/button';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Toaster } from '../ui/toaster';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { collection, query, where, Query } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

const adminStatuses = ['pending', 'approved', 'rejected', 'deleted'] as const;

const adminMenuItems = [
    { status: 'pending', label: 'Pendientes' },
    { status: 'approved', label: 'Aprobados' },
    { status: 'rejected', label: 'Rechazados' },
    { status: 'deleted', label: 'Eliminados' },
] as const;

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useUser();
  const app = useFirebaseApp();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isAdminOpen, setIsAdminOpen] = useState(true);

  // --- START: Admin-specific data fetching for sidebar badges ---
  const queries = useMemo(() => {
    if (!firestore || !user || user.role !== 'admin') return null;
    const result: { [key: string]: { graduate: Query; company: Query } } = {};
    for (const status of adminStatuses) {
        result[status] = {
            graduate: query(collection(firestore, 'users'), where('role', '==', 'graduate'), where('status', '==', status)),
            company: query(collection(firestore, 'users'), where('role', '==', 'company'), where('status', '==', status))
        };
    }
    return result;
  }, [firestore, user]);
  
  const { data: pendingGraduates } = useCollection<AppUser>(queries?.pending.graduate);
  const { data: pendingCompanies } = useCollection<AppUser>(queries?.pending.company);
  const { data: approvedGraduates } = useCollection<AppUser>(queries?.approved.graduate);
  const { data: approvedCompanies } = useCollection<AppUser>(queries?.approved.company);
  const { data: rejectedGraduates } = useCollection<AppUser>(queries?.rejected.graduate);
  const { data: rejectedCompanies } = useCollection<AppUser>(queries?.rejected.company);
  const { data: deletedGraduates } = useCollection<AppUser>(queries?.deleted.graduate);
  const { data: deletedCompanies } = useCollection<AppUser>(queries?.deleted.company);

  const counts = {
      pending: (pendingGraduates?.length ?? 0) + (pendingCompanies?.length ?? 0),
      approved: (approvedGraduates?.length ?? 0) + (approvedCompanies?.length ?? 0),
      rejected: (rejectedGraduates?.length ?? 0) + (rejectedCompanies?.length ?? 0),
      deleted: (deletedGraduates?.length ?? 0) + (deletedCompanies?.length ?? 0),
  };
  // --- END: Admin-specific data fetching ---


  const handleLogout = async () => {
    if (!app) return;
    const auth = getAuth(app);
    await signOut(auth);
    toast({ title: 'Sesión cerrada' });
    window.location.href = '/';
  };

  const getInitials = (name: string = '') => name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('') : '';
  
  const profileHref = user && user.role === 'graduate' ? `/alumni/${user.uid}` : '/my-profile';

  const normalUserMenuItems = [
    { href: '/dashboard', label: 'Feed Social', icon: Home },
    { href: profileHref, label: 'Mi Perfil', icon: User },
    { href: '/directory', label: 'Graduados', icon: Users },
    { href: '/companies', label: 'Empresas', icon: Building },
    { href: '/jobs', label: 'Empleos', icon: Briefcase },
    { href: '/historias-exito', label: 'Historias de Éxito', icon: Trophy },
    { href: '/news', label: 'Noticias UCN', icon: Newspaper },
  ];

  return (
    <SidebarProvider>
        <Sidebar
            side="left"
            variant="sidebar"
            collapsible="icon"
            className="bg-primary text-primary-foreground"
        >
            <SidebarHeader className="p-4 border-b border-primary-foreground/10">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="group-data-[collapsible=icon]:hidden">
                        <p className="text-xs text-primary-foreground/60 mb-2">PORTAL PÚBLICO</p>
                    </div>
                    <Image src="https://i.ibb.co/S4vhbXBM/LOGO-UCN-500-X500-fondo-blanco-PNG.png" alt="Logo UCN Conecta" width={56} height={56} />
                    <div className="group-data-[collapsible=icon]:hidden">
                        <h2 className="font-headline text-xl font-bold">UCN Graduados</h2>
                        <p className="text-sm text-primary-foreground/80">Panel Institucional</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu className="gap-2 p-2">
                    {user?.role === 'admin' ? (
                       <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen} className="w-full">
                            <SidebarMenuItem>
                                <CollapsibleTrigger className="w-full">
                                    <SidebarMenuButton asChild={false} isActive={pathname==='/admin'}>
                                        <Shield />
                                        <span>Admin</span>
                                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50 group-data-[collapsible=icon]:hidden data-[state=open]:rotate-180 transition-transform" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                            </SidebarMenuItem>
                            <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                                <SidebarMenuSub>
                                    {adminMenuItems.map(item => (
                                        <SidebarMenuItem key={item.status}>
                                            <SidebarMenuButton
                                                asChild
                                                size="sm"
                                                isActive={pathname === '/admin' && (searchParams.get('status') || 'pending') === item.status}
                                                tooltip={item.label}
                                            >
                                                <Link href={`/admin?status=${item.status}`}>
                                                    <span>{item.label}</span>
                                                    {counts[item.status] > 0 && <SidebarMenuBadge>{counts[item.status]}</SidebarMenuBadge>}
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </Collapsible>
                    ) : (
                       normalUserMenuItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                className="hover:bg-accent focus:bg-accent data-[active=true]:bg-background data-[active=true]:text-primary"
                                tooltip={item.label}
                            >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))
                    )}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                {user && !loading && (
                    <div className="flex items-center gap-3 p-2">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photoUrl} />
                            <AvatarFallback>{getInitials(user.fullName || user.companyName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow overflow-hidden group-data-[collapsible=icon]:hidden">
                            <p className="font-semibold truncate text-sm">{user.fullName || user.companyName}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground/70 hover:bg-accent hover:text-white flex-shrink-0">
                            <LogOut className="h-5 w-5"/>
                        </Button>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <header className="p-2 border-b md:hidden flex items-center bg-card sticky top-0 z-10">
                <SidebarTrigger/>
                <div className="flex-1 text-center font-headline font-bold">UCN Graduados</div>
            </header>
            <div className="p-4 md:p-6">
                {children}
            </div>
        </SidebarInset>
        <Toaster />
    </SidebarProvider>
  );
}
