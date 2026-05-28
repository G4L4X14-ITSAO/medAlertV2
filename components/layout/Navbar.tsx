'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Stethoscope } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export const Navbar = () => {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#faf7f2]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-slate-950">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-sm">
            <Stethoscope className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">MedAlert</p>
            <p className="text-sm text-slate-600">Monitoreo clínico coordinado</p>
          </div>
        </Link>
        <Button variant="secondary" onClick={handleLogout} className="px-4 py-2">
          <LogOut className="h-4 w-4" />
          Salir
        </Button>
      </div>
    </header>
  );
};
