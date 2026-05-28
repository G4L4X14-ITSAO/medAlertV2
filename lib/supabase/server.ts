import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv(value: string | undefined, name: string) {
  if (!value) {
    return name.includes('SERVICE_ROLE') ? 'placeholder-service-role-key' : 'https://placeholder.supabase.co';
  }
  return value;
}

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    assertEnv(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL'),
    assertEnv(supabaseAnonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookieValues: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookieValues.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch {
            // Server components can read cookies, but some contexts cannot mutate them.
          }
        },
      },
    },
  );
}

export function createServiceClient() {
  return createSupabaseClient(
    assertEnv(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL'),
    assertEnv(supabaseServiceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY'),
  );
}
