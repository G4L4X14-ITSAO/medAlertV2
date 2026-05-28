'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserPlus, FolderOpen } from 'lucide-react';

const navItems = [
  { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctor/patients', label: 'Mis Pacientes', icon: Users },
  { href: '/doctor/patients?invite=true', label: 'Invitar Paciente', icon: UserPlus },
  { href: '/profile', label: 'Perfil', icon: FolderOpen },
];

export const DoctorSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-slate-950 text-slate-100 lg:block">
      <div className="sticky top-0 flex h-screen flex-col gap-6 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300">Médico</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Panel profesional</h2>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href.split('?')[0]);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${active ? 'bg-teal-500 text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
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
