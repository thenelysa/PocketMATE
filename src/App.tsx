import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Layout } from '@/components/Layout';
import { ToastProvider } from '@/components/ui';

// Feature-based page imports (clean versions)
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { BillsPage } from '@/features/bills/pages/BillsPage';
import { CreditCardsPage } from '@/features/cards/pages/CreditCardsPage';
import { LandingPage } from '@/features/landing/LandingPage';
import { RemindersPage } from '@/features/reminders/pages/RemindersPage';
import { ReportsPage } from '@/features/reports/pages/ReportsPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';

// Placeholder pages for routes that need implementation
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#071936] mb-4">{title}</h1>
        <p className="text-[#4B5D7A]">This page is being implemented.</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1FAFA] flex items-center justify-center">
        <div className="text-center">
          <img src="/images/pointing.png" alt="Loading" className="w-24 h-auto mx-auto mb-4" />
          <div className="h-8 w-8 border-4 border-[#078D88] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AuthRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center">
        <div className="text-center">
          <img src="/images/pointing.png" alt="Loading" className="w-24 h-auto mx-auto mb-4" />
          <div className="h-8 w-8 border-4 border-[#078D88] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <LoginPage />;
}

function LandingRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center">
        <div className="text-center">
          <img src="/images/pointing.png" alt="Loading" className="w-24 h-auto mx-auto mb-4" />
          <div className="h-8 w-8 border-4 border-[#078D88] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <LandingPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<AuthRoute />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="bills" element={<BillsPage />} />
        <Route path="cards" element={<CreditCardsPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
