'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Validation Schema untuk Sign Up
const signupSchema = z
    .object({
        name: z.string().min(2, 'Full Name must be at least 2 characters'),
        email: z.string().email('Please enter a valid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
        termsAccepted: z.boolean().refine((val) => val === true, {
            message: 'You must accept the terms and privacy policy',
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type SignUpFormData = z.infer<typeof signupSchema>;

export default function SignUpPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<SignUpFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            termsAccepted: false,
        },
    });

    const onSubmit = async (data: SignUpFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const resData = await response.json();

            if (!response.ok) {
                throw new Error(resData.message || 'Registration failed');
            }

            reset();
            router.push('/auth/login?registered=true');
        } catch (err) {
            // Fallback jika API belum dibuat: tampilkan feedback atau simulasikan redirect
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Hero Section - Left Side (Konsisten dengan Halaman Login) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-400 via-blue-600 to-purple-800 animate-gradient flex-col justify-between p-12">
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
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <p className="text-blue-100">Automated reference validation</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <p className="text-blue-100">Comprehensive analytics & reporting</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <p className="text-blue-100">Secure & reliable infrastructure</p>
                        </div>
                    </div>
                </div>

                <p className="text-black-200 text-sm mt-6">
                    © 2026 Validex. All rights reserved. Made with{' '}
                    <span className="text-red-500">❤️</span>by <span className="font-bold">thrrrxx</span>
                </p>
            </div>

            {/* Form Section - Right Side */}
            <div className="flex w-full lg:w-1/2 flex-col justify-center px-8 sm:px-12 py-8 overflow-y-auto">
                <div className="max-w-md w-full mx-auto lg:mx-0">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">Create an Account</h2>
                        <p className="text-gray-600 mt-2">Join Validex to streamline your document validation</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* FULL NAME */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                                <input
                                    {...register('name')}
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    disabled={isLoading}
                                    className={`w-full text-gray-700 text-sm placeholder:text-gray-300 pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.name
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300 bg-white hover:border-gray-400'
                                        }`}
                                />
                            </div>
                            {errors.name && (
                                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        {/* EMAIL */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                                <input
                                    {...register('email')}
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    disabled={isLoading}
                                    className={`w-full text-gray-700 text-sm placeholder:text-gray-300 pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.email
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300 bg-white hover:border-gray-400'
                                        }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* PASSWORD */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                                <input
                                    {...register('password')}
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="At least 6 characters"
                                    disabled={isLoading}
                                    className={`w-full text-gray-700 text-sm placeholder:text-gray-300 pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.password
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300 bg-white hover:border-gray-400'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* CONFIRM PASSWORD */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                                <input
                                    {...register('confirmPassword')}
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Repeat your password"
                                    disabled={isLoading}
                                    className={`w-full text-gray-700 text-sm placeholder:text-gray-300 pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.confirmPassword
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300 bg-white hover:border-gray-400'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={isLoading}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* TERMS & CONDITIONS */}
                        <div className="pt-1">
                            <div className="flex items-start">
                                <input
                                    {...register('termsAccepted')}
                                    id="termsAccepted"
                                    type="checkbox"
                                    disabled={isLoading}
                                    className="w-4 h-4 mt-0.5 text-blue-600 bg-gray-100 border-gray-300 rounded"
                                />
                                <label htmlFor="termsAccepted" className="ml-2.5 text-sm text-gray-600 cursor-pointer">
                                    I agree to the{' '}
                                    <span className="text-blue-600 hover:text-blue-700 font-medium font-semibold">Terms of Service</span>{' '}
                                    and{' '}
                                    <span className="text-blue-600 hover:text-blue-700 font-medium font-semibold">Privacy Policy</span>
                                </label>
                            </div>
                            {errors.termsAccepted && (
                                <p className="text-red-600 text-sm mt-1">{errors.termsAccepted.message}</p>
                            )}
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* FOOTER LINK BACK TO LOGIN */}
                    <p className="text-center text-gray-600 text-sm mt-6">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}