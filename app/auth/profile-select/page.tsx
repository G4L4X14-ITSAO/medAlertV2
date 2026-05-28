'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRole, updateUserRole } from '@/actions/auth';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function ProfileSelectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUserId(user.id);
      const role = await getUserRole(user.id);
      if (role === 'PATIENT') {
        router.push('/dashboard');
      } else if (role === 'PROFESSIONAL') {
        router.push('/doctor/dashboard');
      } else if (role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard');
      }
    };

    loadUser();
  }, [router, supabase]);

  const chooseRole = async (role: 'PATIENT' | 'PROFESSIONAL') => {
    if (!userId) return;
    setLoadingRole(true);
    try {
      if (role === 'PATIENT') {
        await updateUserRole(userId, role);
        toast.success('Perfil guardado');
        router.push('/dashboard');
        return;
      }

      toast.success('Completa tu verificación médica');
      router.push('/auth/verify-professional');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el perfil');
    } finally {
      setLoadingRole(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Selecciona tu perfil</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">¿Cómo vas a usar MedAlert?</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => chooseRole('PATIENT')}
            className="rounded-3xl border border-slate-200 p-6 text-left transition hover:border-teal-300 hover:bg-teal-50"
          >
            <p className="text-lg font-semibold text-slate-950">Paciente</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Consulta tu plan, registra signos y marca adherencia.</p>
          </button>
          <button
            type="button"
            onClick={() => chooseRole('PROFESSIONAL')}
            className="rounded-3xl border border-slate-200 p-6 text-left transition hover:border-slate-900 hover:bg-slate-950 hover:text-white"
          >
            <p className="text-lg font-semibold">Médico</p>
            <p className="mt-2 text-sm leading-6 text-slate-500 group-hover:text-slate-200">Revisa pacientes, gestiona botiquines y verifica signos.</p>
          </button>
        </div>
        {loadingRole ? <p className="mt-4 text-sm text-slate-500">Guardando...</p> : null}
      </div>
    </div>
  );
}
