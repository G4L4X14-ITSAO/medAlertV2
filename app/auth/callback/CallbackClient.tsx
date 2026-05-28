'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function CallbackClient({
  code,
  token,
  error,
  errorCode,
  errorDescription,
}: {
  code: string | null;
  token?: string | null;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}) {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }
  const [message, setMessage] = useState('Validando sesión...');
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    const completeSession = async () => {
      if (hasCompletedRef.current) {
        return;
      }

      hasCompletedRef.current = true;

      if (error || errorCode || errorDescription) {
        const description = errorDescription ?? 'El enlace ya no es válido o expiró.';
        setMessage(description);

        const { data } = await supabaseRef.current!.auth.getUser();
        if (data.user) {
          router.replace('/auth/profile-select');
          return;
        }

        router.replace('/auth/login');
        return;
      }

      const sessionKey = code ?? token ?? null;

      if (!sessionKey) {
        const { data } = await supabaseRef.current!.auth.getUser();
        if (data.user) {
          router.replace('/auth/profile-select');
          return;
        }

        router.replace('/auth/login');
        return;
      }

      const { error: exchangeError } = await supabaseRef.current!.auth.exchangeCodeForSession(sessionKey);
      if (exchangeError) {
        setMessage('No se pudo completar la sesión.');

        const { data } = await supabaseRef.current!.auth.getUser();
        if (data.user) {
          router.replace('/auth/profile-select');
          return;
        }

        router.replace('/auth/login');
        return;
      }

      router.replace('/auth/profile-select');
    };

    completeSession();
  }, [code, token, error, errorCode, errorDescription, router]);

  return (
    <div className="grid min-h-screen place-items-center px-6 py-12">
      <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-10 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">MedAlert</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">{message}</h1>
        {error || errorCode ? (
          <p className="mt-3 text-sm text-slate-500">Si ya habías iniciado sesión en este navegador, la app te enviará al siguiente paso. Si no, vuelve a pedir un enlace nuevo.</p>
        ) : null}
      </div>
    </div>
  );
}