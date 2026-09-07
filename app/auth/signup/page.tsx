export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm border border-gray-200 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign Up</h1>
                <p className="text-sm text-gray-600 mb-6">
                    Sign up feature is coming soon.
                </p>
                <a
                    href="/auth/login"
                    className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                    &larr; Back to Login
                </a>
            </div>
        </div>
    );
}
