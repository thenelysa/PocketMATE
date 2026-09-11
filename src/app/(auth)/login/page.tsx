'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Mail, Lock, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) throw new Error('No credential returned');

      setIsLoading(true);
      setError('');

      const decoded = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      const userData = {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      };

      // Save user to database
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        throw new Error('Failed to save user');
      }

      // Login locally
      login(userData);
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed.');
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#D5ECEB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            <Link href="/" className="flex items-center gap-3">
              <img src="/images/logo.png" alt="PocketMATE Logo" className="h-10 w-auto" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#078D88] to-[#19C4B6] bg-clip-text text-transparent">
                PocketMATE
              </span>
            </Link>
            <Link href="/" className="text-[#078D88] hover:text-[#065F5F] font-semibold">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-[#D5ECEB] p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#071936] mb-2">Welcome Back</h1>
              <p className="text-[#4B5D7A]">Sign in to manage your bills</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="100%"
              />

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#D5ECEB]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-[#4B5D7A]">or continue with email</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[#071936] mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4B5D7A]" />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-[#071936] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4B5D7A]" />
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-[#4B5D7A]">
              Don&apos;t have an account?{' '}
              <button className="text-[#078D88] font-semibold hover:underline">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#071936] py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">© 2026 PocketMATE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
