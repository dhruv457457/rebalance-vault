'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVaultConfig } from '@/hooks/useVaultData';
import { useStrategy } from '@/hooks/useStrategy';
import { formatBps } from '@/lib/formatters';
import { AddressLink } from '@/components/ui/AddressLink';
import { parseContractError } from '@/lib/errors';
import { isAddress } from 'viem';

const KNOWN_STRATEGIES: { label: string; address: `0x${string}` }[] = [
  { label: 'ThresholdStrategy', address: '0x910074FdFCDC0d3d96150C4F3c7291d558A4205e' },
];

export function VaultConfig() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useVaultConfig();
  const { setActiveStrategy, isPending, isSuccess } = useStrategy();
  const [customAddr, setCustomAddr] = useState('');
  const [stratError, setStratError] = useState<{ message: string; hint?: string } | null>(null);

  async function handleSetStrategy(addr: string) {
    setStratError(null);
    if (!isAddress(addr)) {
      setStratError({ message: 'Invalid address' });
      return;
    }
    try {
      await setActiveStrategy(addr as `0x${string}`);
      setCustomAddr('');
    } catch (err: unknown) {
      setStratError(parseContractError(err));
    }
  }

  return (
    <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="font-black text-sm uppercase tracking-widest text-[#888]">
          Vault Configuration
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="text-[#888] text-xs"
        >
          ▼
        </motion.span>
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
            <div className="px-6 pb-6 border-t border-[#1A1A1A] pt-5">
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 rounded bg-[#1A1A1A]" />
                  ))}
                </div>
              ) : data ? (
                <div className="grid md:grid-cols-2 gap-3">
                  <ConfigRow
                    label="TARGET ALLOCATION"
                    value={`${Number(data[0]) / 100}% ETH / ${100 - Number(data[0]) / 100}% USDC`}
                  />
                  <ConfigRow label="DRIFT THRESHOLD" value={formatBps(data[1])} />
                  <ConfigRow label="MAX SLIPPAGE" value={formatBps(data[2])} />
                  <ConfigRow
                    label="MIN REBALANCE INTERVAL"
                    value={`${Number(data[3])} blocks`}
                  />
                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-[#888]">
                      ACTIVE STRATEGY
                    </span>
                    <AddressLink address={data[4]} className="text-xs" />
                  </div>
                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-[#888]">
                      SWAP ADAPTER
                    </span>
                    <AddressLink address={data[5]} className="text-xs" />
                  </div>
                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-[#888]">
                      YIELD ADAPTER
                    </span>
                    <AddressLink address={data[6]} className="text-xs" />
                  </div>
                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-[#888]">
                      PRICE FEED
                    </span>
                    <AddressLink address={data[7]} className="text-xs" />
                  </div>
                </div>
              ) : null}

              {/* ── Switch Strategy ── */}
              <div className="mt-5 pt-5 border-t border-[#1A1A1A] space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-[#888]">SWITCH STRATEGY</p>

                {/* Known strategies */}
                <div className="flex flex-wrap gap-2">
                  {KNOWN_STRATEGIES.map((s) => (
                    <motion.button
                      key={s.address}
                      whileTap={{ scale: 0.97 }}
                      disabled={isPending}
                      onClick={() => handleSetStrategy(s.address)}
                      className="px-3 py-2 rounded-xl border border-[#CAFF04]/40 text-[#CAFF04] text-[10px] font-black uppercase tracking-widest hover:bg-[#CAFF04]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {isPending ? '...' : s.label}
                    </motion.button>
                  ))}
                </div>

                {/* Custom address input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAddr}
                    onChange={(e) => setCustomAddr(e.target.value)}
                    placeholder="0x... custom strategy address"
                    className="flex-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl px-4 py-3 text-white font-mono text-xs font-bold focus:outline-none focus:border-[#CAFF04]/50 transition-colors placeholder:text-[#555]"
                  />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={isPending || !customAddr}
                    onClick={() => handleSetStrategy(customAddr)}
                    className="px-4 py-3 rounded-xl bg-[#CAFF04] text-black font-black text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4ff33] transition-all whitespace-nowrap flex items-center gap-1.5"
                  >
                    {isPending ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      'SET'
                    )}
                  </motion.button>
                </div>

                {stratError && (
                  <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-xl px-4 py-3">
                    <p className="text-[#FF4444] text-xs font-bold">{stratError.message}</p>
                    {stratError.hint && (
                      <p className="text-[#FF4444]/60 text-xs mt-1 leading-relaxed">{stratError.hint}</p>
                    )}
                  </div>
                )}

                {isSuccess && (
                  <p className="text-[#00FF88] text-xs bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-xl px-4 py-3 font-bold">
                    ✓ STRATEGY UPDATED
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-3 flex justify-between items-center">
      <span className="text-xs font-black uppercase tracking-widest text-[#888]">{label}</span>
      <span className="font-mono text-xs font-bold text-white">{value}</span>
    </div>
  );
}
