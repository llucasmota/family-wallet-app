import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['pt-BR', 'en'],
  defaultLocale: 'pt-BR',
  localePrefix: 'as-needed',
});

export default async function middleware(request: NextRequest) {
  // 1. First run the internationalization middleware
  const response = intlMiddleware(request);

  // 2. Initialize Supabase SSR client with request and response cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 3. Retrieve authenticated user session from Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // List of public routes that do NOT require authentication
  const isPublicRoute =
    pathname === '/auth' ||
    pathname.startsWith('/auth/') ||
    pathname.includes('/auth') ||
    pathname.startsWith('/join/') ||
    pathname.includes('/join/');

  // 4. If visitor is NOT authenticated and trying to access a protected page -> Redirect to /auth
  if (!user && !isPublicRoute) {
    const locale = pathname.startsWith('/en') ? 'en' : '';
    const authUrl = new URL(locale ? `/${locale}/auth` : '/auth', request.url);
    return NextResponse.redirect(authUrl);
  }

  // 5. If user IS authenticated and trying to visit /auth -> Redirect to / (Dashboard)
  if (user && pathname.includes('/auth') && !pathname.includes('/reset-password')) {
    const locale = pathname.startsWith('/en') ? 'en' : '';
    const homeUrl = new URL(locale ? `/${locale}` : '/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
