import { APP_DESCRIPTION, APP_NAME } from '@/lib/config';
import { MyThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { Inter } from 'next/font/google';
import type React from 'react';
import ClientLayout from './client-layout';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <MyThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ClientLayout isSignedIn={isSignedIn}>{children}</ClientLayout>
            <Toaster />
          </MyThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
