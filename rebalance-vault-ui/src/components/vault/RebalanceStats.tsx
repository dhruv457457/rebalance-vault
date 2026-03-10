'use client';

import { useRebalanceStatsData } from '@/hooks/useVaultData';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { formatUnits } from 'viem';
import type { ReactNode } from 'react';

export function RebalanceStats() {
  const { data, isLoading } = useRebalanceStatsData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[#111]" />
        ))}
      </div>
    );
  }

  const [rebalanceCount, lastRebalanceBlock, , totalVolumeSwapped, totalGasUsed, totalSlippageLost] =
    data ?? [0n, 0n, 0n, 0n, 0n, 0n];

  const volumeEth = Number(formatUnits(totalVolumeSwapped ?? 0n, 18));
  const slippageUsd = Number(formatUnits(totalSlippageLost ?? 0n, 18));

  const stats: { label: string; value: ReactNode; color: string }[] = [
    {
      label: 'REBALANCES',
      value: <AnimatedNumber value={Number(rebalanceCount ?? 0n)} decimals={0} />,
      color: 'text-[#CAFF04]',
    },
    {
      label: 'VOLUME SWAPPED',
      value: (
        <>
          <AnimatedNumber value={volumeEth} decimals={4} />
          <span className="text-sm text-[#888] ml-1 font-bold">ETH</span>
        </>
      ),
      color: 'text-[#7B61FF]',
    },
    {
      label: 'GAS USED',
      value: Number(totalGasUsed ?? 0n).toLocaleString(),
      color: 'text-[#00F0FF]',
    },
    {
      label: 'SLIPPAGE LOST',
      value: (
        <>
          $<AnimatedNumber value={slippageUsd} decimals={4} />
        </>
      ),
      color: 'text-[#FF4444]',
    },
    {
      label: 'LAST BLOCK',
      value:
        lastRebalanceBlock && lastRebalanceBlock > 0n
          ? `#${Number(lastRebalanceBlock).toLocaleString()}`
          : '—',
      color: 'text-[#00FF88]',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-5 card-hover"
        >
          <p className="text-xs font-black uppercase tracking-widest text-[#888] mb-3">{s.label}</p>
          <div className={`font-black text-2xl leading-none tabular ${s.color}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
