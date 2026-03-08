'use client';

import { useRebalanceStatsData } from '@/hooks/useVaultData';
import { StatCard } from '@/components/ui/StatCard';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { formatUnits } from 'viem';

export function RebalanceStats() {
  const { data, isLoading } = useRebalanceStatsData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-pulse">
        {[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-[#1C1C28]" />)}
      </div>
    );
  }

  const [rebalanceCount, lastRebalanceBlock, lastRebalancePrice, totalVolumeSwapped, totalGasUsed, totalSlippageLost] = data ?? [0n, 0n, 0n, 0n, 0n, 0n];

  const volumeEth = Number(formatUnits(totalVolumeSwapped ?? 0n, 18));
  const slippageUsd = Number(formatUnits(totalSlippageLost ?? 0n, 6));

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <StatCard
        label="Total Rebalances"
        value={<AnimatedNumber value={Number(rebalanceCount ?? 0n)} decimals={0} />}
        accent="violet"
      />
      <StatCard
        label="Volume Swapped"
        value={<><AnimatedNumber value={volumeEth} decimals={4} /><span className="text-sm text-[#94A3B8] ml-1">ETH</span></>}
        accent="cyan"
      />
      <StatCard
        label="Total Gas Used"
        value={<AnimatedNumber value={Number(totalGasUsed ?? 0n)} decimals={0} />}
        subValue="gas units"
        accent="lime"
      />
      <StatCard
        label="Slippage Lost"
        value={<>$<AnimatedNumber value={slippageUsd} decimals={2} /></>}
        accent="coral"
      />
      <StatCard
        label="Last Rebalance"
        value={lastRebalanceBlock && lastRebalanceBlock > 0n ? `#${Number(lastRebalanceBlock).toLocaleString()}` : '—'}
        subValue="block"
        accent="green"
      />
    </div>
  );
}
