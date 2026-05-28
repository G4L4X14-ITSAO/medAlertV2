'use client';

import { createBrowserClient } from '@supabase/ssr';

function assertEnv(value: string | undefined, name: string) {
  if (!value) {
    return 'https://placeholder.supabase.co';
  }
  return value;
}

export const createClient = () =>
  createBrowserClient(
    assertEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    assertEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  );
