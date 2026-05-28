'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, History, Home, Pill } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/medications', label: 'Mis Medicamentos', icon: Pill },
  { href: '/dashboard/signos', label: 'Registrar Signos', icon: Activity },
  { href: '/dashboard/signos/history', label: 'Historial', icon: History },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white/80 backdrop-blur lg:block">
      <div className="sticky top-0 flex h-screen flex-col gap-6 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Paciente</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Tu tablero</h2>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${active ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
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
