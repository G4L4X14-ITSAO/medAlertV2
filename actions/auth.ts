'use server';

import { createClient } from '@/lib/supabase/server';
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
  const { data, error } = await supabase.rpc('get_user_role', { user_id: userId });

  if (error) {
    console.error('getUserRole failed:', error.message);
    return null;
  }

  return (data as UserRole | null) ?? null;
}

export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = createClient();
  const { error } = await supabase.rpc('upsert_user_role', { user_id: userId, new_role: role });

  if (error) {
    throw new Error(error.message);
  }
}
