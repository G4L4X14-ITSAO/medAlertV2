'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types';

export async function signInWithMagicLink(email: string): Promise<{ ok: boolean; message: string }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    const isRateLimited = error.message.toLowerCase().includes('rate limit') || error.status === 429;
    const message = isRateLimited
      ? 'Demasiados intentos. Espera unos minutos antes de pedir otro enlace.'
      : error.message;

    return { ok: false, message };
  }

  return { ok: true, message: 'Revisa tu correo para continuar' };
}

export async function exchangeCodeForSession(code: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getUserRole(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema('core_auth')
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.role as UserRole | null;
}

export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .schema('core_auth')
    .from('user_profiles')
    .update({ role })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}
