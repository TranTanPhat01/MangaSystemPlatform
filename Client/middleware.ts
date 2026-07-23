import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/register', '/demo'];

const rules: Record<string, string[]> = {
  '/assistant': ['assistant', 'admin'],
  '/board': ['editorialboard', 'admin'],
  '/editorial': ['tantoueditor', 'editorialboard', 'admin'],
  '/files': ['mangaka', 'assistant', 'admin'],
  '/series': ['mangaka', 'admin'],
  '/tasks': ['mangaka', 'assistant', 'admin'],
  '/admin': ['admin'],
};

const normalize = (role: string) => role.toLowerCase().replace(/[\s_-]/g, '');

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check if path is public
  const isPublic = publicPaths.some((path) => (path === '/' ? pathname === '/' : pathname.startsWith(path)));

  // Get auth token from cookies
  const token = request.cookies.get('auth_token')?.value;

  // Redirect to login if not authenticated and path requires auth
  if (!token && !isPublic) {
    const target = new URL('/login', request.url);
    target.searchParams.set('redirect', pathname);
    return NextResponse.redirect(target);
  }

  // Redirect to dashboard if already logged in and trying to access login/register
  if (token && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check role-based access control
  const allowed = Object.entries(rules).find(([path]) => pathname.startsWith(path))?.[1];
  if (token && allowed) {
    try {
      const roles = (JSON.parse(request.cookies.get('user_roles')?.value || '[]') as string[]).map(normalize);
      if (!roles.some((role) => allowed.includes(role))) {
        return NextResponse.rewrite(new URL('/forbidden', request.url));
      }
    } catch {
      return NextResponse.rewrite(new URL('/forbidden', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};;
