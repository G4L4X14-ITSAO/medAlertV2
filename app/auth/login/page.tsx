'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Mail, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

const authSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type AuthFormData = z.infer<typeof authSchema>;
type AuthMode = 'sign-in' | 'sign-up';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in');
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({ resolver: zodResolver(authSchema) });

  useEffect(() => {
    const supabase = createClient();

    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id });
      const role = roleData as string | null;
      router.replace(
        role === 'SUPER_ADMIN' ? '/admin/dashboard'
        : role === 'PROFESSIONAL' ? '/doctor/dashboard'
        : role === 'PATIENT' ? '/dashboard'
        : '/auth/profile-select'
      );
    };

    checkSession();
  }, [router]);

  const onSubmit = async (formData: AuthFormData) => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setDebugMessage(null);
    try {
      const supabase = createClient();
      if (authMode === 'sign-up') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/profile-select`,
          },
        });

        if (signUpError) {
          toast.error(signUpError.message);
          return;
        }

        if (signUpData.session) {
          toast.success('Cuenta creada y sesión iniciada');
          router.replace('/auth/profile-select');
          return;
        }

        toast.success('Cuenta creada. Revisa tu correo para confirmar la cuenta.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast.error(error.message);
        setDebugMessage(error.message);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data: roleData } = user
        ? await supabase.rpc('get_user_role', { user_id: user.id })
        : { data: null };
      const role = roleData as string | null;

      toast.success('Sesión iniciada');
      router.replace(
        role === 'SUPER_ADMIN' ? '/admin/dashboard'
        : role === 'PROFESSIONAL' ? '/doctor/dashboard'
        : role === 'PATIENT' ? '/dashboard'
        : '/auth/profile-select'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión';
      console.error('Auth submit failed:', error);
      toast.error(message);
      setDebugMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex items-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
            <Sparkles className="h-4 w-4" />
            Seguimiento clínico coordinado
          </div>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">MedAlert ordena el cuidado diario en un solo lugar.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            Entra con correo y contraseña para registrar signos, seguir tratamientos y conectar pacientes con su equipo médico.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {['Correo y contraseña', 'Roles separados', 'Seguimiento clínico'].map((item) => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-medium text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center border-t border-slate-200 bg-slate-950 px-6 py-12 text-white lg:border-l lg:border-t-0">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-300">Entrar</p>
          <h2 className="mt-2 text-3xl font-semibold">Accede con tu cuenta</h2>
          <div className="mt-6 flex rounded-2xl border border-white/10 bg-white/5 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setAuthMode('sign-in')}
              className={`flex-1 rounded-xl px-3 py-2 transition ${authMode === 'sign-in' ? 'bg-teal-400 text-slate-950' : 'text-slate-300'}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('sign-up')}
              className={`flex-1 rounded-xl px-3 py-2 transition ${authMode === 'sign-up' ? 'bg-teal-400 text-slate-950' : 'text-slate-300'}`}
            >
              Crear cuenta
            </button>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Correo electrónico</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Mail className="h-4 w-4 text-teal-300" />
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  className="w-full bg-transparent text-white outline-none placeholder:text-slate-400"
                  {...register('email')}
                />
              </div>
              {errors.email ? <span className="text-sm text-rose-300">{errors.email.message}</span> : null}
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Contraseña</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Lock className="h-4 w-4 text-teal-300" />
                <input
                  type="password"
                  placeholder="Tu contraseña"
                  className="w-full bg-transparent text-white outline-none placeholder:text-slate-400"
                  {...register('password')}
                />
              </div>
              {errors.password ? <span className="text-sm text-rose-300">{errors.password.message}</span> : null}
            </label>
            <p className="text-sm leading-6 text-slate-300">
              {authMode === 'sign-in'
                ? 'Ingresa con tu correo y contraseña.'
                : 'Crea tu cuenta con correo y contraseña. Si el proveedor pide verificación por correo, la verás al registrarte.'}
            </p>
            <Button type="submit" isLoading={isLoading} className="w-full">
              {authMode === 'sign-in' ? 'Entrar' : 'Crear cuenta'}
            </Button>
            {debugMessage ? (
              <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {debugMessage}
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
}
