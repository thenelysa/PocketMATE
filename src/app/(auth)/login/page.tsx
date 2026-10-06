'use client';

import { useState } from 'react';
import { signInWithGoogle } from '@/features/auth/hooks';
import { useAuth } from '@/features/auth/auth-context';
import { useGoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { Mascot } from '@/components/mascot';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError('');

        const userData = await signInWithGoogle(tokenResponse.access_token);
        login(userData);
        router.push('/dashboard');
      } catch (err) {
        setError('Failed to sign in. Please try again.');
        console.error('Login error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google sign-in was cancelled or failed.');
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="site-header wrap"><BrandLogo /><Link href="/" className="text-link !mt-0"><ArrowLeft size={15} /> Back home</Link></header>
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="login-layout">
          <section className="login-story"><p className="eyebrow">A LITTLE LESS ON YOUR MIND</p><h2>Come on in.<br />Get a little<br />more together.</h2><Mascot /></section>
          <section className="login-content">
            <p className="eyebrow text-muted mb-4">YOUR POCKETMATE AWAITS</p><h1 className="dashboard-heading mb-3">Welcome home.</h1><p className="text-sm text-muted mb-8">Sign in to give your bills, cards, and due dates a place of their own.</p>
            {error && <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            {isLoading ? (
              <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Signing you in?</p>
            ) : (
              <button
                onClick={() => googleLogin()}
                className="google-login-button flex items-center justify-center gap-3 w-full py-3 px-6 text-white rounded-xl font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            )}
            <p className="text-xs text-muted mt-8 leading-relaxed">New here? Your account is created when you first continue with Google.</p>
          </section>
        </div>
      </main>
      <footer className="wrap py-6 border-t border-line text-xs text-muted">PocketMATE ? Your everyday money companion.</footer>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
