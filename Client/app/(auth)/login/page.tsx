'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { AuthResponse } from '@/types/auth';
import { ArrowLeft, Sparkles, User, Lock, Mail, Globe, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import Logo from '@/components/mangaka/Logo';

// Translation dictionary for login page
const loginTranslations = {
  VI: {
    back: "Quay lại trang chủ",
    badge: "Truy cập Hệ thống",
    title: "Đăng nhập tài khoản",
    subtitle: "Vui lòng điền thông tin đăng nhập của bạn để truy cập khu vực làm việc.",
    emailLabel: "Địa chỉ Email",
    passLabel: "Mật khẩu",
    passForgot: "Quên mật khẩu?",
    btnSubmit: "Đăng Nhập",
    btnSubmitting: "Đang xác thực...",
    noAccount: "Chưa có tài khoản?",
    registerLink: "Tạo tài khoản mới",
    visualText: "Tối ưu hóa toàn bộ quy trình làm việc của bạn. Giao tiếp, nộp bản vẽ, kiểm duyệt và tính toán xếp hạng nhanh chóng trên một nền tảng đồng nhất.",
    formFieldsError: "Vui lòng nhập đầy đủ các thông tin.",
    invalidCredentials: "Email hoặc mật khẩu không chính xác.",
    connectionError: "Không thể kết nối đến Identity Service. Vui lòng đảm bảo các dịch vụ backend đang chạy.",
  },
  EN: {
    back: "Back to homepage",
    badge: "Workspace Access",
    title: "Sign in to account",
    subtitle: "Please enter your credentials to access the workspace.",
    emailLabel: "Email Address",
    passLabel: "Password",
    passForgot: "Forgot password?",
    btnSubmit: "Sign In",
    btnSubmitting: "Authenticating...",
    noAccount: "Don't have an account?",
    registerLink: "Create an account",
    visualText: "Streamline your complete creative pipeline. Communicate, submit pages, markup reviews, and calculate rankings on a unified platform.",
    formFieldsError: "Please fill in all fields.",
    invalidCredentials: "Invalid email or password.",
    connectionError: "Failed to connect to the Identity Service. Please check that the backend services are running.",
  }
};

interface LoginFormProps {
  t: typeof loginTranslations.VI;
}

function LoginForm({ t }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.replace(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError(t.formFieldsError);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/identity/auth/login', {
        email,
        password,
      });

      if (response.data && response.data.success) {
        // Store auth details (this will also write tokens to cookies for middleware)
        setAuth(response.data.data);
        
        const redirect = searchParams.get('redirect') || '/dashboard';
        router.replace(redirect);
      } else {
        setError(response.data.error || t.invalidCredentials);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const backendError = err.response?.data?.error || err.response?.data?.message;
      setError(backendError || t.connectionError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold leading-relaxed">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {t.emailLabel}
        </label>
        <div className="relative group">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-burgundy-700 transition-colors" />
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="editor@manga.com"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700/20 transition-all text-xs font-semibold"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {t.passLabel}
          </label>
          <Link href="#" className="text-[10px] font-semibold text-burgundy-800 hover:text-burgundy-950 hover:underline">
            {t.passForgot}
          </Link>
        </div>
        <div className="relative group">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-burgundy-700 transition-colors" />
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700/20 transition-all text-xs font-semibold"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 rounded-lg bg-burgundy-800 hover:bg-burgundy-900 active:bg-burgundy-950 text-white font-bold text-xs shadow-sm shadow-burgundy-900/10 focus:outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {t.btnSubmitting}
          </>
        ) : (
          t.btnSubmit
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  const [lang, setLang] = useState<'VI' | 'EN'>('VI');
  
  const t = loginTranslations[lang];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 antialiased font-sans">
      
      {/* Top Bar Actions (Fixed top left back button and top right language toggle) */}
      <div className="absolute top-5 left-5 z-30">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-655 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs hover:border-slate-350 transition-all"
        >
          <ArrowLeft size={14} className="stroke-[2.5]" />
          <span>{t.back}</span>
        </Link>
      </div>

      <div className="absolute top-5 right-5 z-30">
        <div className="relative group">
          <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold transition-colors">
            <Globe size={14} className="stroke-[2]" />
            <span>{lang === 'VI' ? 'Tiếng Việt (VI)' : 'English (EN)'}</span>
            <ChevronDown size={12} className="stroke-[2.5]" />
          </button>
          <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-150 rounded-lg shadow-md hidden group-hover:block overflow-hidden py-1">
            <button onClick={() => setLang('VI')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-bold">Tiếng Việt (VI)</button>
            <button onClick={() => setLang('EN')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-bold">English (EN)</button>
          </div>
        </div>
      </div>

      {/* Left panel: Visual theme split */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center border-r border-slate-200">
        {/* Subtle plum/burgundy theme gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-plum-950/40 via-slate-900 to-slate-950 z-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-burgundy-850/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-plum-800/10 rounded-full blur-3xl" />
        
        <div className="relative z-20 text-center max-w-lg px-8">
          <Logo size={64} className="mx-auto mb-6 shadow-xl shadow-burgundy-900/10 rounded-2xl" />
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4 uppercase">
            MangaFlow
          </h1>
          <p className="text-slate-400 leading-relaxed text-sm font-semibold">
            {t.visualText}
          </p>
          <div className="mt-12 flex justify-center gap-6 text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
            <span>App Router</span>
            <span>•</span>
            <span>Gateway Ready</span>
            <span>•</span>
            <span>Studio Engine</span>
          </div>
        </div>
      </div>

      {/* Right panel: Login Form Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-sm space-y-6 bg-white border border-slate-150 p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-burgundy-50 text-burgundy-900 border border-burgundy-100/50 mb-3 uppercase tracking-wider">
              <Sparkles size={11} className="text-burgundy-750" />
              {t.badge}
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-800">
              {t.title}
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 font-semibold leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          <Suspense fallback={
            <div className="flex justify-center p-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-burgundy-800 border-t-transparent" />
            </div>
          }>
            <LoginForm t={t} />
          </Suspense>

          <div className="text-center text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100">
            {t.noAccount}{' '}
            <Link href="/register" className="font-bold text-burgundy-855 hover:text-burgundy-950 hover:underline">
              {t.registerLink}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
