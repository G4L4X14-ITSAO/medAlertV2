'use client';

import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="grid min-h-screen place-items-center px-6 py-12">
      <div className="max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-white">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-slate-950">Acceso denegado</h1>
        <p className="mt-3 text-slate-600">Tu sesión no tiene permisos para ver esta sección.</p>
        <Button className="mt-6 w-full" onClick={() => router.back()}>Volver</Button>
      </div>
    </div>
  );
}
