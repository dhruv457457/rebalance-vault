'use client';

import { useFeeInfo } from '@/hooks/useVaultData';
import { formatUnits } from 'viem';
import { AddressLink } from '@/components/ui/AddressLink';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

export function FeePanel() {
  const { data, isLoading } = useFeeInfo();

  if (isLoading) return <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-6 animate-pulse h-48" />;

  const [managementFeeBps, performanceFeeBps, highWaterMark, accruedFees, feeRecipient] =
    data ?? [200n, 2000n, 0n, 0n, '0x'];
  const hwm = Number(formatUnits(highWaterMark ?? 0n, 18));
  const accrued = Number(formatUnits(accruedFees ?? 0n, 18));

  return (
    <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-6 card-hover h-full">
      <h3 className="font-black text-sm uppercase tracking-widest text-[#888] mb-5">Fee Structure</h3>
      <div className="space-y-3">
        {[
          {
            label: 'MANAGEMENT FEE',
            value: `${Number(managementFeeBps ?? 200n) / 100}% / year`,
            color: 'text-white',
          },
          {
            label: 'PERFORMANCE FEE',
            value: `${Number(performanceFeeBps ?? 2000n) / 100}% of profits`,
            color: 'text-white',
          },
          {
            label: 'HIGH WATER MARK',
            value: hwm > 0 ? `$${hwm.toFixed(4)}` : '—',
            color: 'text-[#CAFF04]',
          },
          {
            label: 'ACCRUED FEES',
            value: null,
            color: 'text-[#888]',
            node: (
              <span className="font-black text-sm text-[#888]">
                $<AnimatedNumber value={accrued} decimals={4} />
              </span>
            ),
          },
        ].map((row) => (
          <div
            key={row.label}
            className="flex justify-between items-center py-2 border-b border-[#1A1A1A] last:border-0"
          >
            <span className="text-xs font-black uppercase tracking-widest text-[#888]">{row.label}</span>
            {row.node ? (
              row.node
            ) : (
              <span className={`font-black text-sm tabular ${row.color}`}>{row.value}</span>
            )}
          </div>
        ))}
        {feeRecipient && feeRecipient !== '0x' && (
          <div className="flex justify-between items-center py-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#888]">RECIPIENT</span>
            <AddressLink address={feeRecipient as string} className="text-xs" />
          </div>
        )}
      </div>
    </div>
  );
}
