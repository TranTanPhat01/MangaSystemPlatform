'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { AuthResponse } from '@/types/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/identity/auth/register', {
        email,
        password,
        fullName,
      });

      if (response.data && response.data.success) {
        // Automatically authenticate on successful registration
        setAuth(response.data.data);
        router.replace('/dashboard');
      } else {
        setError(response.data.error || 'Registration failed.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const backendError = err.response?.data?.error || err.response?.data?.message;
      setError(backendError || 'Failed to connect to the Identity Service. Please check that the backend services are running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left panel: Abstract Manga theme visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center border-r border-slate-800/80">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-slate-900 to-slate-950 z-10" />
        {/* Abstract design elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-20 text-center max-w-lg px-8">
          <div className="h-16 w-16 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-3xl text-white shadow-xl shadow-indigo-500/20">
            M
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-4">
            MangaSystem Platform
          </h1>
          <p className="text-slate-450 leading-relaxed text-md font-medium">
            Streamline your publication workflow. Connect mangakas, editors, and assistants on a unified, high-performance platform.
          </p>
          <div className="mt-12 flex justify-center gap-6 text-xs text-slate-500 font-mono">
            <span>Next.js App Router</span>
            <span>•</span>
            <span>Gateway Proxy Ready</span>
            <span>•</span>
            <span>SignalR Configured</span>
          </div>
        </div>
      </div>

      {/* Right panel: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8 bg-slate-900/40 p-8 rounded-2xl border border-slate-800/60 backdrop-blur-sm">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Register as a staff member or author.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-450 text-xs leading-normal">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Eiichiro Oda"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="author@manga.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
