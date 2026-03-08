'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGuardStatus } from '@/hooks/useVaultData';
import { formatBps } from '@/lib/formatters';

export function GuardPanel() {
  const { data, isLoading } = useGuardStatus();

  if (isLoading) {
    return (
      <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-5 animate-pulse h-64" />
    );
  }

  const [circuitBreakerTripped, maxPriceChangeBps, , rebalancesInWindow, maxRebalancesPerWindow, maxSwapSizeBps] = data ?? [false, 500n, 0n, 0n, 5n, 1000n];
  const isTripped = circuitBreakerTripped ?? false;
  const ratePct = Number(maxRebalancesPerWindow ?? 5n) > 0 ? (Number(rebalancesInWindow ?? 0n) / Number(maxRebalancesPerWindow ?? 5n)) * 100 : 0;

  const guards = [
    { label: 'Volatility Check', value: `Max ${formatBps(maxPriceChangeBps ?? 500n)} change`, ok: !isTripped, pct: isTripped ? 100 : 20 },
    { label: 'Rate Limit', value: `${Number(rebalancesInWindow ?? 0n)} / ${Number(maxRebalancesPerWindow ?? 5n)} rebalances`, ok: ratePct < 100, pct: ratePct },
    { label: 'Swap Size', value: `Max ${formatBps(maxSwapSizeBps ?? 1000n)} of pool`, ok: true, pct: 30 },
    { label: 'Circuit Breaker', value: isTripped ? 'TRIPPED' : 'Clear', ok: !isTripped, pct: isTripped ? 100 : 0 },
  ];

  return (
    <motion.div
      animate={{ backgroundColor: isTripped ? 'rgba(239,68,68,0.08)' : '#1C1C28' }}
      transition={{ duration: 0.5 }}
      className="border rounded-xl p-5"
      style={{ borderColor: isTripped ? 'rgba(239,68,68,0.4)' : '#2D2D3D' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="text-xl">🛡️</span> Guard System
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isTripped ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
          <span className={`w-2 h-2 rounded-full ${isTripped ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
          {isTripped ? 'CIRCUIT BREAKER TRIPPED' : 'All Systems Go'}
        </div>
      </div>

      <div className="space-y-4">
        {guards.map((g) => (
          <div key={g.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[#94A3B8] text-xs">{g.label}</span>
              <span className={`text-xs font-mono ${g.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                {g.ok ? '✓' : '✗'} {g.value}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#2D2D3D] overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${g.ok ? 'bg-emerald-500' : 'bg-rose-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(g.pct, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
