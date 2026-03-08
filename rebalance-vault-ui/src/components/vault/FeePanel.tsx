'use client';

import { useFeeInfo } from '@/hooks/useVaultData';
import { formatUnits } from 'viem';
import { AddressLink } from '@/components/ui/AddressLink';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

export function FeePanel() {
  const { data, isLoading } = useFeeInfo();

  if (isLoading) return <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-5 animate-pulse h-48" />;

  const [managementFeeBps, performanceFeeBps, highWaterMark, accruedFees, feeRecipient] = data ?? [200n, 2000n, 0n, 0n, '0x'];
  const hwm = Number(formatUnits(highWaterMark ?? 0n, 18)).toFixed(6);
  const accrued = Number(formatUnits(accruedFees ?? 0n, 18));

  return (
    <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">💰</span> Fee Structure
      </h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between py-2 border-b border-[#2D2D3D]">
          <span className="text-[#94A3B8]">Management Fee</span>
          <span className="font-mono text-white">{Number(managementFeeBps ?? 200n) / 100}% / year</span>
        </div>
        <div className="flex justify-between py-2 border-b border-[#2D2D3D]">
          <span className="text-[#94A3B8]">Performance Fee</span>
          <span className="font-mono text-white">{Number(performanceFeeBps ?? 2000n) / 100}% of profits</span>
        </div>
        <div className="flex justify-between py-2 border-b border-[#2D2D3D]">
          <span className="text-[#94A3B8]">High Water Mark</span>
          <span className="font-mono text-cyan-400">${hwm}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-[#2D2D3D]">
          <span className="text-[#94A3B8]">Accrued Fees</span>
          <span className="font-mono text-yellow-400">$<AnimatedNumber value={accrued} decimals={4} /></span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-[#94A3B8]">Fee Recipient</span>
          {feeRecipient && feeRecipient !== '0x' ? (
            <AddressLink address={feeRecipient as string} />
          ) : (
            <span className="text-[#94A3B8] font-mono text-xs">Not set</span>
          )}
        </div>
      </div>
    </div>
  );
}
