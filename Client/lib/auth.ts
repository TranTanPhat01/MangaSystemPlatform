import cookie from 'cookie';

export const AUTH_COOKIE_NAME = 'auth_token';
export const ROLES_COOKIE_NAME = 'user_roles';

export function setAuthCookies(token: string, roles: string[], expiresAt?: string) {
  if (typeof window === 'undefined') return;
  const maxAge = expiresAt ? Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000) : 60 * 60 * 24 * 7;
  
  document.cookie = cookie.serialize(AUTH_COOKIE_NAME, token, {
    path: '/',
    maxAge: maxAge > 0 ? maxAge : undefined,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  document.cookie = cookie.serialize(ROLES_COOKIE_NAME, JSON.stringify(roles), {
    path: '/',
    maxAge: maxAge > 0 ? maxAge : undefined,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

export function removeAuthCookies() {
  if (typeof window === 'undefined') return;
  
  document.cookie = cookie.serialize(AUTH_COOKIE_NAME, '', {
    path: '/',
    expires: new Date(0),
  });

  document.cookie = cookie.serialize(ROLES_COOKIE_NAME, '', {
    path: '/',
    expires: new Date(0),
  });
}

export function getAuthCookie(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const cookies = cookie.parse(document.cookie || '');
  return cookies[AUTH_COOKIE_NAME];
}

export function getUserRolesCookie(): string[] {
  if (typeof window === 'undefined') return [];
  const cookies = cookie.parse(document.cookie || '');
  const rolesStr = cookies[ROLES_COOKIE_NAME];
  if (!rolesStr) return [];
  try {
    return JSON.parse(rolesStr);
  } catch {
    return [];
  }
}
