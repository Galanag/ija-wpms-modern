'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { login, request } from '../../lib/api';
import { Button } from '../../components/ui/button';

export function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  const validateForm = useCallback(() => {
    const errors: { username?: string; password?: string } = {};
    
    if (!username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [username, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setBusy(true);
    
    try {
      await login(username.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      const message = err?.message || 'Unable to sign in. Please check your credentials.';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[#f5f3ed]">
      {/* Left Side - Branding */}
      <section className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[#123a28] via-[#1a4d3a] to-[#0d2d1f] p-12 flex-col justify-between">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-[#2c7384]/20 blur-3xl animate-pulse" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-[#4a9d7c]/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#2c7384]/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Geometric Patterns */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white border border-white/20">
              IJA
            </div>
            <div>
              <div className="text-white font-semibold text-lg tracking-wide">IJA Developer</div>
              <div className="text-white/60 text-sm">Enterprise Platform</div>
            </div>
          </div>
          
          <h1 className="font-serif text-5xl xl:text-6xl text-white leading-tight mb-6">
            Planning, performance and management in one place.
          </h1>
          
          <p className="text-white/70 text-lg max-w-lg leading-relaxed">
            A connected workspace for strategy, budgets, finance, people, projects, risk and executive decisions.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3 text-white/60">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm">Secure, role-based access control</span>
          </div>
          <div className="flex items-center gap-3 text-white/60">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm">Real-time performance monitoring</span>
          </div>
          <div className="text-white/40 text-xs">
            © 2026 IJA Developer. All rights reserved.
          </div>
        </div>
      </section>

      {/* Right Side - Login Form */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#123a28] text-xl font-bold text-white mb-4">
              IJA
            </div>
            <p className="text-sm font-semibold uppercase tracking-[.15em] text-[#2c7384]">
              IJA Developer
            </p>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a18] tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-[#5b584e]">
              Sign in to your enterprise management workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#3d3a32] mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[#8a8578]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: undefined });
                  }}
                  autoComplete="username"
                  autoFocus
                  placeholder="Enter your username"
                  className={`
                    w-full pl-11 pr-4 py-3 rounded-lg border bg-white text-[#1a1a18] placeholder-[#8a8578]
                    transition-all duration-200 text-base
                    focus:outline-none focus:ring-2 focus:ring-[#123a28]/20 focus:border-[#123a28]
                    ${fieldErrors.username ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-[#ddd8ca] hover:border-[#c4c0b4]'}
                  `}
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1.5 text-sm text-red-600">{fieldErrors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#3d3a32] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[#8a8578]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`
                    w-full pl-11 pr-12 py-3 rounded-lg border bg-white text-[#1a1a18] placeholder-[#8a8578]
                    transition-all duration-200 text-base
                    focus:outline-none focus:ring-2 focus:ring-[#123a28]/20 focus:border-[#123a28]
                    ${fieldErrors.password ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-[#ddd8ca] hover:border-[#c4c0b4]'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8a8578] hover:text-[#5b584e] transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#ddd8ca] text-[#123a28] focus:ring-[#123a28]/20 cursor-pointer"
                />
                <span className="ml-2 text-sm text-[#5b584e]">Remember me</span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              loading={busy}
              disabled={busy}
            >
              {busy ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#ddd8ca] text-center">
            <p className="text-xs text-[#8a8578]">
              By signing in, you agree to our{' '}
              <a href="#" className="text-[#123a28] hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-[#123a28] hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
