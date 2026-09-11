'use client';

import { useAuth } from '@/context/AuthContext';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#071936]">Settings</h2>
        <p className="text-[#4B5D7A] mt-1">Manage your account and preferences</p>
      </div>

      <div className="text-center py-16 bg-white rounded-2xl border border-[#D5ECEB]">
        <Settings className="w-16 h-16 text-[#D5ECEB] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#071936] mb-2">Settings coming soon</h3>
        <p className="text-[#4B5D7A]">Account settings and preferences will appear here</p>
      </div>
    </div>
  );
}
