import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/register', '/', '/demo'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, next assets, APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  const isAdminPath = pathname.startsWith('/admin');
  const isPublicPath = publicPaths.some((path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  });

  // If trying to access a protected page without a token, redirect to login
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    // Save original URL to redirect back after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in and trying to access login/register, redirect to dashboard
  if (token && isPublicPath && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isAdminPath && token) {
    const rolesCookie = request.cookies.get('user_roles')?.value || '[]';
    try {
      const roles = JSON.parse(rolesCookie) as string[];
      const hasAdminRole = roles.some((role) => role.toLowerCase() === 'admin');
      if (!hasAdminRole) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
