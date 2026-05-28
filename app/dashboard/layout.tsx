import type { ReactNode } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main className="flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-6">{children}</main>
      </div>
      <MobileNav variant="patient" />
    </div>
  );
}
