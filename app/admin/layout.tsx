import type { ReactNode } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:flex">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
