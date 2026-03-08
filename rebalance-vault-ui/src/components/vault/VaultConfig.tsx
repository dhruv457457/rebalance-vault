'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVaultConfig } from '@/hooks/useVaultData';
import { formatBps } from '@/lib/formatters';
import { AddressLink } from '@/components/ui/AddressLink';

export function VaultConfig() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useVaultConfig();

  return (
    <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-white font-semibold flex items-center gap-2">
          <span className="text-xl">⚙️</span> Vault Configuration
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="text-[#94A3B8]"
        >▼</motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 text-sm border-t border-[#2D2D3D] pt-4">
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-4 rounded bg-[#2D2D3D]" />)}
                </div>
              ) : data ? (
                <>
                  <Row label="Target Allocation" value={`${Number(data[0]) / 100}% ETH / ${100 - Number(data[0]) / 100}% USDC`} />
                  <Row label="Drift Threshold" value={formatBps(data[1])} />
                  <Row label="Max Slippage" value={formatBps(data[2])} />
                  <Row label="Min Rebalance Interval" value={`${Number(data[3])} blocks`} />
                  <div className="flex justify-between py-1 border-b border-[#2D2D3D]">
                    <span className="text-[#94A3B8]">Active Strategy</span>
                    <AddressLink address={data[4]} />
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2D2D3D]">
                    <span className="text-[#94A3B8]">Swap Adapter</span>
                    <AddressLink address={data[5]} />
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2D2D3D]">
                    <span className="text-[#94A3B8]">Yield Adapter</span>
                    <AddressLink address={data[6]} />
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#94A3B8]">Price Feed</span>
                    <AddressLink address={data[7]} />
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-[#2D2D3D]">
      <span className="text-[#94A3B8]">{label}</span>
      <span className="font-mono text-white text-xs">{value}</span>
    </div>
  );
}
