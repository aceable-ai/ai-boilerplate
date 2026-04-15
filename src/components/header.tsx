'use client';

import { APP_NAME } from '@/lib/config';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function Header() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <span className="text-lg font-bold text-primary-foreground">{APP_NAME[0]}</span>
          </div>
          <Link href="/meetings" className="flex items-center">
            <span className="text-xl font-bold">{APP_NAME}</span>
          </Link>
        </div>
      </div>
      <div className="ml-auto">
        <button
          onClick={() => { void handleLogout(); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}
