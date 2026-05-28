import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookieValues: Array<{ name: string; value: string; options: Parameters<typeof response.cookies.set>[2] }>) {
          cookieValues.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;

  if (path === '/auth/login' || path === '/auth/callback' || path === '/auth/profile-select' || path === '/auth/verify-professional') {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  const { data: role, error } = await supabase.rpc('get_user_role', { user_id: user.id });

  if (error) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (path.startsWith('/admin') && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  if (path.startsWith('/doctor') && role !== 'PROFESSIONAL' && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  if (path.startsWith('/dashboard') && role !== 'PATIENT' && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
