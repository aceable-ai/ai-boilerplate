'use client';

import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from '@/components/ui/sidebar';
import { Home, Image, Import, MessageCircle, Pencil } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {' '}
        {/* Add padding top to account for sticky header */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/'} tooltip="Home">
              <Link href="/">
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/bulk-text')}>
              <Link href="/bulk-text">
                <Pencil className="h-4 w-4" />
                <span>Bulk Text</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/course-import')}>
              <Link href="/course-import">
                <Import className="h-4 w-4" />
                <span>Course Import</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/chat')}>
              <Link href="/chat">
                <MessageCircle className="h-4 w-4" />
                <span>Live Chat</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/image')}>
              <Link href="/image">
                <Image className="h-4 w-4" />
                <span>Image</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
