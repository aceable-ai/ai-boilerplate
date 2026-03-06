'use client';

import { AppSidebar } from '@/components/app-sidebar';
import Header from '@/components/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideLayout = pathname.startsWith('/sign-in');

  return hideLayout ? (
    children
  ) : (
    <SidebarProvider>
      <Header />
      <AppSidebar />
      <SidebarInset>
        <main className="w-full max-w-[1920px] mx-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
