'use client';

import { TvlChart } from '@/components/charts/TvlChart';
import { SharePriceChart } from '@/components/charts/SharePriceChart';
import { DriftHistoryChart } from '@/components/charts/DriftHistoryChart';

export default function AnalyticsPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0A0A0F] grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-white">Analytics</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Historical performance and vault metrics</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <TvlChart />
          <div className="grid md:grid-cols-2 gap-6">
            <SharePriceChart />
            <DriftHistoryChart />
          </div>
        </div>

        <p className="text-center text-xs text-[#94A3B8] mt-8">
          Charts show representative data. On-chain historical indexing coming soon.
        </p>
      </div>
    </div>
  );
}
