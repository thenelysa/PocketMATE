import { useGoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import {
  Receipt,
  Bell,
  TrendingUp,
  Plus,
  BellRing,
  CheckCircle,
} from 'lucide-react';

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        // Handle login - redirect to dashboard
        window.location.href = '/app/dashboard';
      } catch (error) {
        console.error('Login error:', error);
      }
    },
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8F5]">
      {/* Spacer for fixed header */}
      <div className="h-[72px]" />

      {/* Header - Sticky with gradient on scroll */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-gradient-to-r from-[#078D88]/90 to-[#19C4B6]/90 backdrop-blur-sm shadow-lg'
          : 'bg-white border-b border-[#D5ECEB]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="PocketMATE Logo" className="h-10 w-auto" />
              <span className={`text-xl font-bold ${
                scrolled
                  ? 'text-white'
                  : 'bg-gradient-to-r from-[#078D88] to-[#19C4B6] bg-clip-text text-transparent'
              }`}>
                PocketMATE
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className={`text-base font-semibold transition-colors ${
                scrolled ? 'text-white hover:text-[#F7F8F5]' : 'text-[#078D88] hover:text-[#065F5F]'
              }`}>
                Features
              </a>
              <a href="#how-it-works" className={`text-base font-semibold transition-colors ${
                scrolled ? 'text-white hover:text-[#F7F8F5]' : 'text-[#078D88] hover:text-[#065F5F]'
              }`}>
                How It Works
              </a>
            </nav>
            <Button
              onClick={() => login()}
              className={`${
                scrolled
                  ? 'bg-white text-[#078D88] hover:bg-[#F7F8F5]'
                  : 'bg-gradient-to-r from-[#078D88] to-[#19C4B6] text-white hover:opacity-90'
              }`}
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F7F8F5] to-[#E8F8F7] py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-[#071936] leading-tight mb-6">
                Master Your Bills,{' '}
                <span className="bg-gradient-to-r from-[#078D88] to-[#19C4B6] bg-clip-text text-transparent">
                  Multiply Your Peace
                </span>
              </h1>
              <p className="text-lg text-[#4B5D7A] mb-8 max-w-xl mx-auto lg:mx-0">
                Stop juggling due dates and overdue notices. PocketMATE brings all your bills together in one smart, intuitive dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => login()}
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-[#078D88] text-[#078D88] hover:bg-[#F0FAF4] px-8"
                >
                  Login
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src="/images/mascot-bill.png"
                alt="PocketMATE Mascot"
                className="w-full max-w-md mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#071936] mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-[#078D88] to-[#19C4B6] bg-clip-text text-transparent">
                Stay Organized
              </span>
            </h2>
            <p className="text-lg text-[#4B5D7A] max-w-2xl mx-auto">
              Powerful features designed to make bill management effortless
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#F7F8F5] rounded-2xl p-8 border border-[#D5ECEB] hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-[#078D88] to-[#19C4B6] rounded-xl flex items-center justify-center mb-6">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#071936] mb-3">Bill Tracking</h3>
              <p className="text-[#4B5D7A]">
                Keep all your bills in one place. Never miss a payment with automatic due date tracking.
              </p>
            </div>

            <div className="bg-[#F7F8F5] rounded-2xl p-8 border border-[#D5ECEB] hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-[#078D88] to-[#19C4B6] rounded-xl flex items-center justify-center mb-6">
                <BellRing className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#071936] mb-3">Smart Reminders</h3>
              <p className="text-[#4B5D7A]">
                Get timely notifications before due dates. Customize reminders to fit your schedule.
              </p>
            </div>

            <div className="bg-[#F7F8F5] rounded-2xl p-8 border border-[#D5ECEB] hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-[#078D88] to-[#19C4B6] rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#071936] mb-3">Budget Insights</h3>
              <p className="text-[#4B5D7A]">
                Visualize your spending patterns and stay on top of your monthly expenses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-[#F7F8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#071936] mb-4">
              How It Works
            </h2>
            <p className="text-lg text-[#4B5D7A]">
              Get started in minutes, not hours
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#078D88] to-[#19C4B6] rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#071936] mb-3">Add Your Bills</h3>
              <p className="text-[#4B5D7A]">
                Enter your bills once. We'll track everything for you automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#078D88] to-[#19C4B6] rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#071936] mb-3">Set Reminders</h3>
              <p className="text-[#4B5D7A]">
                Choose when to be reminded. Get alerts via browser notifications.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#078D88] to-[#19C4B6] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#071936] mb-3">Stay On Top</h3>
              <p className="text-[#4B5D7A]">
                Never pay late fees again. Manage bills from any device, anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#071936] mb-4">
            Ready to Take Control?
          </h2>
          <p className="text-lg text-[#4B5D7A] mb-8">
            Join thousands of users who have simplified their bill management.
          </p>
          <Button
            size="lg"
            onClick={() => login()}
            className="bg-gradient-to-r from-[#078D88] to-[#19C4B6] text-white hover:opacity-90 px-8"
          >
            Login
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#071936] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="PocketMATE Logo" className="h-8 w-auto brightness-0 invert" />
              <span className="text-lg font-bold text-white">
                PocketMATE
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Your Personal Bill Management Assistant
            </p>
            <p className="text-sm text-gray-400">
              © 2026 PocketMATE. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
