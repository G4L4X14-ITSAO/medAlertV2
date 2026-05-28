'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShieldCheck } from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/dashboard#pending', label: 'Verificaciones', icon: ShieldCheck },
];

export const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white/80 backdrop-blur lg:block">
      <div className="sticky top-0 flex h-screen flex-col gap-6 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">Administración</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Control central</h2>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href.split('#')[0]);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${active ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
