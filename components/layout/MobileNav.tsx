'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, FolderOpen, History, Home, LayoutDashboard, Pill, Users } from 'lucide-react';

const patientItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/medications', label: 'Medicamentos', icon: Pill },
  { href: '/dashboard/signos', label: 'Signos', icon: Activity },
  { href: '/dashboard/signos/history', label: 'Historial', icon: History },
];

const doctorItems = [
  { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctor/patients', label: 'Pacientes', icon: Users },
  { href: '/profile', label: 'Perfil', icon: FolderOpen },
];

export const MobileNav = ({ variant }: { variant: 'patient' | 'doctor' }) => {
  const pathname = usePathname();
  const items = variant === 'doctor' ? doctorItems : patientItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white lg:hidden">
      <div className="flex">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 px-2 py-3 text-xs font-medium transition ${active ? 'text-teal-700' : 'text-slate-500 hover:text-slate-950'}`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-teal-700' : ''}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
