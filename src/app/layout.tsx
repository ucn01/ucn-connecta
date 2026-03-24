import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import FirebaseErrorListener from '@/components/FirebaseErrorListener';
import { MainLayout } from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'UCN Connecta',
  description: 'Red de Graduados de la Universidad Central de Nicaragua',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background flex flex-col')}>
        <FirebaseClientProvider>
          <FirebaseErrorListener>
            <MainLayout>{children}</MainLayout>
          </FirebaseErrorListener>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
