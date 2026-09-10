'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/theme/ThemeToggle';

// Validation Schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<z.input<typeof loginSchema>, any, LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Login failed');
      }

      reset();
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0F17] transition-colors duration-200">
      {/* Hero Section - Left Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-400 via-blue-700 to-purple-800 animate-gradient flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-700 font-bold text-lg">V</span>
            </div>
            <h1 className="text-white text-2xl font-bold">Validex</h1>
          </div>
        </div>

        <div className="text-white text-justify px-50">
          <h2 className="text-5xl font-bold mt-5 leading-tight">
            Validate. Organize. Trust.
          </h2>
          <p className="text-blue-100 text-lg mt-6 mb-6 max-w-md leading-relaxed">
            Professional document reference validation for teams that care about accuracy.
            Streamline your validation workflow and maintain document integrity with confidence.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-blue-100">Automated reference validation</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-blue-100">Comprehensive analytics & reporting</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-blue-100">Secure & reliable infrastructure</p>
            </div>
          </div>
        </div>

        <p className="text-blue-100 text-sm mt-6">
          © 2026 Validex. All rights reserved. Made with
          <span className="text-red-400"> ❤️ </span> by <span className="font-bold text-white">thrrrxx</span>
        </p>
      </div>

      {/* Form Section - Right Side */}
      <div className="relative flex w-full lg:w-1/2 flex-col justify-center px-8 sm:px-12 py-12 bg-white dark:bg-[#0B0F17] transition-colors duration-200">
        {/* Dark Mode Switcher */}
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full mx-auto lg:mx-0">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your account to continue</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* EMAIL FIELD */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  disabled={isLoading}
                  className={`w-full text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                    errors.email
                      ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-950/30'
                      : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-gray-400 dark:hover:border-gray-600'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1.5">{errors.email.message}</p>
              )}
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className={`w-full text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                    errors.password
                      ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-950/30'
                      : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-gray-400 dark:hover:border-gray-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1.5">{errors.password.message}</p>
              )}
            </div>

            {/* REMEMBER ME */}
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                id="rememberMe"
                type="checkbox"
                disabled={isLoading}
                className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Keep me signed in
              </label>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-xs shadow-blue-200 dark:shadow-none cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-8">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold">
              Sign up
            </Link>
          </p>

          {/* DEMO CREDENTIALS */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-300 font-semibold mb-2">Demo Credentials (Dev Only):</p>
            <p className="text-xs text-blue-800 dark:text-blue-400">Email: demo@example.com</p>
            <p className="text-xs text-blue-800 dark:text-blue-400">Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
