'use client';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ProfileCard } from '@/components/feed/ProfileCard';
import { CreatePost } from '@/components/feed/CreatePost';
import { Timeline } from '@/components/feed/Timeline';
import { RightSidebar } from '@/components/feed/RightSidebar';
import { CompanyProfileCard } from '@/components/feed/CompanyProfileCard';

export default function DashboardPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // The MainLayout handles redirects and status pages for non-logged-in,
  // admin, or non-approved users. If we reach here, we can assume `user` exists
  // and is approved. A fallback check is good practice.
  if (!user) {
    router.replace('/');
    return null;
  }

  return (
    <div className="bg-muted/40 min-h-[calc(100vh-4rem)] -m-4 md:-m-6">
      <div className="container mx-auto grid grid-cols-12 gap-8 py-8 px-4">
        <aside className="hidden lg:block lg:col-span-3">
          {user.role === 'graduate' ? (
            <ProfileCard user={user} />
          ) : user.role === 'company' ? (
            <CompanyProfileCard user={user} />
          ) : null}
        </aside>
        <main className="col-span-12 lg:col-span-6">
          <div className="space-y-6">
            <CreatePost user={user} />
            <Timeline />
          </div>
        </main>
        <aside className="hidden lg:block lg:col-span-3">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
}
