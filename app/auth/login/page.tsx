'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { signInWithMagicLink } from '@/actions/auth';
import { createClient } from '@/lib/supabase/client';

const emailSchema = z.object({
  email: z.string().email('Correo inválido'),
});

const codeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Ingresa el código de 6 dígitos'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type CodeFormData = z.infer<typeof codeSchema>;

type AuthStep = 'magic-link' | 'code';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [authStep, setAuthStep] = useState<AuthStep>('magic-link');
  const [pendingEmail, setPendingEmail] = useState('');
  const cooldownStorageKey = 'medalert_magic_link_cooldown_until';
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
    watch: watchEmail,
  } = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) });
  const {
    register: registerCode,
    handleSubmit: handleCodeSubmit,
    formState: { errors: codeErrors },
    reset: resetCodeForm,
  } = useForm<CodeFormData>({ resolver: zodResolver(codeSchema) });

  useEffect(() => {
    const supabase = createClient();

    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.replace('/auth/profile-select');
      }
    };

    checkSession();
  }, [router]);

  const currentEmail = watchEmail('email') ?? '';

  useEffect(() => {
    const savedUntil = window.localStorage.getItem(cooldownStorageKey);
    if (!savedUntil) {
      return;
    }

    const remainingSeconds = Math.max(0, Math.ceil((Number(savedUntil) - Date.now()) / 1000));
    if (remainingSeconds > 0) {
      setCooldownSeconds(remainingSeconds);
    } else {
      window.localStorage.removeItem(cooldownStorageKey);
    }
  }, []);

  useEffect(() => {
    if (cooldownSeconds === 0) {
      window.localStorage.removeItem(cooldownStorageKey);
      return;
    }

    window.localStorage.setItem(cooldownStorageKey, String(Date.now() + cooldownSeconds * 1000));
    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const onSendLink = async (data: EmailFormData) => {
    if (isLoading || cooldownSeconds > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithMagicLink(data.email);
      if (!result.ok) {
        toast.error(result.message);
        if (result.message.toLowerCase().includes('demasiados intentos')) {
          setCooldownSeconds(180);
        }
        return;
      }

      setPendingEmail(data.email);
      setAuthStep('code');
      resetCodeForm();
      setCooldownSeconds(120);
      toast.success('Revisa tu correo y escribe el código de 6 dígitos o abre el enlace.');
    } catch {
      toast.error('No se pudo enviar el enlace');
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyCode = async (data: CodeFormData) => {
    const email = pendingEmail || currentEmail;
    if (!email) {
      toast.error('Primero escribe tu correo');
      setAuthStep('magic-link');
      return;
    }

    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: data.code,
        type: 'email',
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Código validado');
      router.replace('/auth/profile-select');
    } catch {
      toast.error('No se pudo validar el código');
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
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            MedAlert ordena el cuidado diario en un solo lugar.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            Accede con enlace mágico, registra signos, sigue tratamientos y conecta pacientes con su equipo médico sin fricción.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {['Acceso sin contraseña', 'Roles separados', 'Seguimiento clínico'].map((item) => (
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
          <h2 className="mt-2 text-3xl font-semibold">Recibe tu acceso seguro</h2>
          <div className="mt-6 flex rounded-2xl border border-white/10 bg-white/5 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setAuthStep('magic-link')}
              className={`flex-1 rounded-xl px-3 py-2 transition ${authStep === 'magic-link' ? 'bg-teal-400 text-slate-950' : 'text-slate-300'}`}
            >
              Enlace
            </button>
            <button
              type="button"
              onClick={() => setAuthStep('code')}
              className={`flex-1 rounded-xl px-3 py-2 transition ${authStep === 'code' ? 'bg-teal-400 text-slate-950' : 'text-slate-300'}`}
            >
              Código
            </button>
          </div>

          {authStep === 'magic-link' ? (
            <form className="mt-8 space-y-4" onSubmit={handleEmailSubmit(onSendLink)}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Correo electrónico</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Mail className="h-4 w-4 text-teal-300" />
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    className="w-full bg-transparent text-white outline-none placeholder:text-slate-400"
                    {...registerEmail('email')}
                  />
                </div>
                {emailErrors.email ? <span className="text-sm text-rose-300">{emailErrors.email.message}</span> : null}
              </label>
              <p className="text-sm leading-6 text-slate-300">
                Te enviamos un enlace y, si tu plantilla de Supabase usa el token, también podrás copiar un código de 6 dígitos.
              </p>
              <Button type="submit" isLoading={isLoading} disabled={cooldownSeconds > 0} className="w-full">
                {cooldownSeconds > 0 ? `Espera ${cooldownSeconds}s para reenviar` : 'Enviar enlace mágico'}
              </Button>
            </form>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={handleCodeSubmit(onVerifyCode)}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Correo electrónico</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Mail className="h-4 w-4 text-teal-300" />
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    defaultValue={pendingEmail || currentEmail}
                    className="w-full bg-transparent text-white outline-none placeholder:text-slate-400"
                    onChange={(event) => setPendingEmail(event.target.value)}
                  />
                </div>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Código de 6 dígitos</span>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400"
                  {...registerCode('code')}
                />
                {codeErrors.code ? <span className="text-sm text-rose-300">{codeErrors.code.message}</span> : null}
              </label>
              <p className="text-sm leading-6 text-slate-300">
                Usa el código del correo si prefieres no abrir el enlace. Si no lo ves, vuelve al modo enlace.
              </p>
              <Button type="submit" isLoading={isLoading} className="w-full">
                Validar código
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
