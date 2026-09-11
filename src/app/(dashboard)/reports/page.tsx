'use client';

import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#071936]">Reports</h2>
        <p className="text-[#4B5D7A] mt-1">Visualize your spending patterns</p>
      </div>

      <div className="text-center py-16 bg-white rounded-2xl border border-[#D5ECEB]">
        <BarChart3 className="w-16 h-16 text-[#D5ECEB] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#071936] mb-2">No data yet</h3>
        <p className="text-[#4B5D7A]">Add bills and credit cards to see your spending reports</p>
      </div>
    </div>
  );
}
