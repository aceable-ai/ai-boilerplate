import { APP_DESCRIPTION, APP_NAME } from '@/lib/config';
import { MyThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Nunito_Sans } from 'next/font/google';
import type React from 'react';
import ClientLayout from './client-layout';
import './globals.css';

const nunitoSans = Nunito_Sans({ subsets: ['latin'], variable: '--font-nunito-sans' });

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${nunitoSans.variable} font-sans`}>
        <MyThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ClientLayout>{children}</ClientLayout>
          <Toaster />
        </MyThemeProvider>
      </body>
    </html>
  );
}
