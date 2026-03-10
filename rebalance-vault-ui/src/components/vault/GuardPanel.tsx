'use client';

import { motion } from 'framer-motion';
import { useGuardStatus } from '@/hooks/useVaultData';
import { formatBps } from '@/lib/formatters';

export function GuardPanel() {
  const { data, isLoading } = useGuardStatus();

  if (isLoading) {
    return (
      <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-6 animate-pulse h-64" />
    );
  }

  const [circuitBreakerTripped, maxPriceChangeBps, , rebalancesInWindow, maxRebalancesPerWindow, maxSwapSizeBps] =
    data ?? [false, 1000n, 0n, 0n, 5n, 2500n];

  const isTripped = circuitBreakerTripped ?? false;
  const ratePct =
    Number(maxRebalancesPerWindow ?? 5n) > 0
      ? (Number(rebalancesInWindow ?? 0n) / Number(maxRebalancesPerWindow ?? 5n)) * 100
      : 0;

  const guards = [
    {
      label: 'CIRCUIT BREAKER',
      value: isTripped ? 'TRIPPED' : 'OFF',
      ok: !isTripped,
      pct: isTripped ? 100 : 0,
    },
    {
      label: 'MAX PRICE CHANGE',
      value: formatBps(maxPriceChangeBps ?? 1000n),
      ok: !isTripped,
      pct: 20,
    },
    {
      label: 'RATE LIMIT',
      value: `${Number(rebalancesInWindow ?? 0n)} / ${Number(maxRebalancesPerWindow ?? 5n)}`,
      ok: ratePct < 100,
      pct: ratePct,
    },
    {
      label: 'MAX SWAP SIZE',
      value: formatBps(maxSwapSizeBps ?? 2500n),
      ok: true,
      pct: 25,
    },
  ];

  return (
    <motion.div
      animate={{
        borderColor: isTripped ? 'rgba(255,68,68,0.4)' : '#1A1A1A',
        backgroundColor: isTripped ? 'rgba(255,68,68,0.04)' : '#111111',
      }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl p-6 border"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-sm uppercase tracking-widest text-[#888]">Guard Status</h3>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
            isTripped
              ? 'bg-[#FF4444]/10 border-[#FF4444]/40 text-[#FF4444]'
              : 'bg-[#00FF88]/10 border-[#00FF88]/30 text-[#00FF88]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isTripped ? 'bg-[#FF4444] animate-ping' : 'bg-[#00FF88]'
            }`}
          />
          {isTripped ? 'TRIPPED' : 'ALL CLEAR'}
        </div>
      </div>

      <div className="space-y-4">
        {guards.map((g) => (
          <div key={g.label}>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-black uppercase tracking-widest text-[#888]">{g.label}</span>
              <span
                className={`text-xs font-black ${g.ok ? 'text-[#00FF88]' : 'text-[#FF4444]'}`}
              >
                {g.value}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#0A0A0A] border border-[#1A1A1A] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(g.pct, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ background: g.ok ? '#00FF88' : '#FF4444' }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
