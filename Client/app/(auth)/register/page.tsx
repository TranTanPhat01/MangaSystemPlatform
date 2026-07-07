'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { AuthResponse } from '@/types/auth';
import { ArrowLeft, Sparkles, User, Lock, Mail, Globe, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import Logo from '@/components/mangaka/Logo';

// Translation dictionary for registration page
const registerTranslations = {
  VI: {
    back: "Quay lại trang chủ",
    badge: "Đăng ký Thành viên",
    title: "Tạo tài khoản mới",
    subtitle: "Vui lòng điền thông tin chi tiết dưới đây để đăng ký tài khoản.",
    nameLabel: "Họ và Tên",
    emailLabel: "Địa chỉ Email",
    passLabel: "Mật khẩu",
    btnSubmit: "Đăng Ký",
    btnSubmitting: "Đang tạo tài khoản...",
    hasAccount: "Đã có tài khoản?",
    loginLink: "Đăng nhập ngay",
    visualText: "Tối ưu hóa toàn bộ quy trình làm việc của bạn. Giao tiếp, nộp bản vẽ, kiểm duyệt và tính toán xếp hạng nhanh chóng trên một nền tảng đồng nhất.",
    formFieldsError: "Vui lòng nhập đầy đủ các thông tin.",
    passLengthError: "Mật khẩu phải dài ít nhất 6 ký tự.",
    invalidRegister: "Đăng ký không thành công.",
    connectionError: "Không thể kết nối đến Identity Service. Vui lòng đảm bảo các dịch vụ backend đang chạy.",
  },
  EN: {
    back: "Back to homepage",
    badge: "Member Registration",
    title: "Create an account",
    subtitle: "Please enter your details below to register an account.",
    nameLabel: "Full Name",
    emailLabel: "Email Address",
    passLabel: "Password",
    btnSubmit: "Sign Up",
    btnSubmitting: "Creating account...",
    hasAccount: "Already have an account?",
    loginLink: "Sign in",
    visualText: "Streamline your complete creative pipeline. Communicate, submit pages, markup reviews, and calculate rankings on a unified platform.",
    formFieldsError: "Please fill in all fields.",
    passLengthError: "Password must be at least 6 characters long.",
    invalidRegister: "Registration failed.",
    connectionError: "Failed to connect to the Identity Service. Please check that the backend services are running.",
  }
};

interface RegisterFormProps {
  t: typeof registerTranslations.VI;
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  error: string | null;
}

function RegisterForm({
  t,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  handleSubmit,
  error
}: RegisterFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold leading-relaxed">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="fullName" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {t.nameLabel}
        </label>
        <div className="relative group">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-burgundy-700 transition-colors" />
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Eiichiro Oda"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700/20 transition-all text-xs font-semibold"
          />
        </div>
      </div>

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
            placeholder="author@manga.com"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-burgundy-700 focus:ring-1 focus:ring-burgundy-700/20 transition-all text-xs font-semibold"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {t.passLabel}
        </label>
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

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();

  const [lang, setLang] = useState<'VI' | 'EN'>('VI');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = registerTranslations[lang];

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
      setError(t.formFieldsError);
      return;
    }

    if (password.length < 6) {
      setError(t.passLengthError);
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
        setError(response.data.error || t.invalidRegister);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const backendError = err.response?.data?.error || err.response?.data?.message;
      setError(backendError || t.connectionError);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Right panel: Register Form Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-sm space-y-6 bg-white border border-slate-150 p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] animate-in fade-in slide-in-from-bottom-2 duration-300">
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

          <RegisterForm
            t={t}
            fullName={fullName}
            setFullName={setFullName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            handleSubmit={handleSubmit}
            error={error}
          />

          <div className="text-center text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100">
            {t.hasAccount}{' '}
            <Link href="/login" className="font-bold text-burgundy-855 hover:text-burgundy-950 hover:underline">
              {t.loginLink}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
