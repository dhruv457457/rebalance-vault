'use client';

import { useYieldInfo } from '@/hooks/useVaultData';
import { formatUnits } from 'viem';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

export function YieldPanel() {
  const { data, isLoading } = useYieldInfo();

  if (isLoading) return <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-5 animate-pulse h-40" />;

  const [totalDepositedToAave, totalYieldEarned, yieldEnabled] = data ?? [0n, 0n, false];
  const deposited = Number(formatUnits(totalDepositedToAave ?? 0n, 6));
  const earned = Number(formatUnits(totalYieldEarned ?? 0n, 6));

  return (
    <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="text-xl">🌱</span> Yield (Aave)
        </h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${yieldEnabled ? 'bg-lime-400/20 text-lime-400 border border-lime-400/30' : 'bg-slate-600/30 text-slate-400 border border-slate-600/30'}`}>
          {yieldEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#13131A] rounded-lg p-3">
          <p className="text-[#94A3B8] text-xs mb-1">Deposited to Aave</p>
          <p className="font-mono text-white font-bold">
            $<AnimatedNumber value={deposited} decimals={2} />
          </p>
        </div>
        <div className="bg-[#13131A] rounded-lg p-3">
          <p className="text-[#94A3B8] text-xs mb-1">Yield Earned</p>
          <p className="font-mono text-lime-400 font-bold">
            +$<AnimatedNumber value={earned} decimals={2} />
          </p>
        </div>
      </div>
    </div>
  );
}
