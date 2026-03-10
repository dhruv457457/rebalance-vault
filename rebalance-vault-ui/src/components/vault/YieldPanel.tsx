'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useYieldInfo } from '@/hooks/useVaultData';
import { useYieldActions } from '@/hooks/useYield';
import { formatUnits } from 'viem';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { parseContractError } from '@/lib/errors';

export function YieldPanel() {
  const { data, isLoading } = useYieldInfo();
  const { depositToYield, withdrawFromYield, harvestYield, toggleYield, isPending, isSuccess } = useYieldActions();

  const [open, setOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [txError, setTxError] = useState<{ message: string; hint?: string } | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  if (isLoading) return <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-6 animate-pulse h-40" />;

  const [totalDepositedToAave, totalYieldEarned, yieldEnabled] = data ?? [0n, 0n, false];
  const deposited = Number(formatUnits(totalDepositedToAave ?? 0n, 6));
  const earned = Number(formatUnits(totalYieldEarned ?? 0n, 6));

  async function handle(action: string, fn: () => Promise<unknown>) {
    setTxError(null);
    setLastAction(null);
    try {
      await fn();
      setLastAction(action);
      setDepositAmount('');
      setWithdrawAmount('');
    } catch (err: unknown) {
      setTxError(parseContractError(err));
    }
  }

  const spinner = (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-6 card-hover h-full flex flex-col">
      {/* ── Stats ── */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-sm uppercase tracking-widest text-[#888]">Yield (Aave)</h3>
        <span
          className={`text-[10px] px-2.5 py-1 rounded-xl font-black uppercase tracking-widest border ${
            yieldEnabled
              ? 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/30'
              : 'bg-[#1A1A1A] text-[#888] border-[#2A2A2A]'
          }`}
        >
          {yieldEnabled ? 'ENABLED' : 'DISABLED'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-4">
          <p className="text-xs font-black uppercase tracking-widest text-[#888] mb-2">DEPOSITED</p>
          <p className="font-black text-xl text-white tabular">
            $<AnimatedNumber value={deposited} decimals={2} />
          </p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-4">
          <p className="text-xs font-black uppercase tracking-widest text-[#888] mb-2">EARNED</p>
          <p className="font-black text-xl text-[#00FF88] tabular">
            +$<AnimatedNumber value={earned} decimals={4} />
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#1A1A1A]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-[#888]">Protocol</span>
          <span className="text-xs font-black text-white">Aave V3</span>
          <span className="text-xs font-black text-[#888]">· USDC</span>
        </div>
      </div>

      {/* ── Manage Yield toggle ── */}
      <div className="mt-4 pt-4 border-t border-[#1A1A1A]">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between text-xs font-black uppercase tracking-widest text-[#888] hover:text-white transition-colors"
        >
          <span>MANAGE YIELD</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            ▼
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="manage"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-3">
                {/* Error */}
                {txError && (
                  <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-xl px-4 py-3">
                    <p className="text-[#FF4444] text-xs font-bold">{txError.message}</p>
                    {txError.hint && (
                      <p className="text-[#FF4444]/60 text-xs mt-1 leading-relaxed">{txError.hint}</p>
                    )}
                  </div>
                )}

                {/* Success */}
                {isSuccess && lastAction && (
                  <p className="text-[#00FF88] text-xs bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-xl px-4 py-3 font-bold">
                    ✓ {lastAction} CONFIRMED
                  </p>
                )}

                {/* Deposit to Aave */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl px-4 py-3 text-white font-mono text-sm font-bold focus:outline-none focus:border-[#CAFF04]/50 transition-colors pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] text-[10px] font-black uppercase tracking-widest">
                      USDC
                    </span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={isPending || !depositAmount}
                    onClick={() => handle('DEPOSIT TO AAVE', () => depositToYield(depositAmount))}
                    className="px-4 py-3 rounded-xl bg-[#CAFF04] text-black font-black text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4ff33] transition-all whitespace-nowrap flex items-center gap-1.5"
                  >
                    {isPending ? spinner : 'DEPOSIT TO AAVE'}
                  </motion.button>
                </div>

                {/* Withdraw from Aave */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl px-4 py-3 text-white font-mono text-sm font-bold focus:outline-none focus:border-[#CAFF04]/50 transition-colors pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] text-[10px] font-black uppercase tracking-widest">
                      USDC
                    </span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={isPending || !withdrawAmount}
                    onClick={() => handle('WITHDRAW FROM AAVE', () => withdrawFromYield(withdrawAmount))}
                    className="px-4 py-3 rounded-xl border-2 border-[#CAFF04] text-[#CAFF04] font-black text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#CAFF04]/10 transition-all whitespace-nowrap flex items-center gap-1.5"
                  >
                    {isPending ? spinner : 'WITHDRAW FROM AAVE'}
                  </motion.button>
                </div>

                {/* Harvest + Toggle row */}
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={isPending}
                    onClick={() => handle('HARVEST YIELD', () => harvestYield())}
                    className="py-3 rounded-xl bg-[#CAFF04] text-black font-black text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4ff33] transition-all flex items-center justify-center gap-1.5"
                  >
                    {isPending ? spinner : 'HARVEST YIELD'}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={isPending}
                    onClick={() => handle(yieldEnabled ? 'YIELD DISABLED' : 'YIELD ENABLED', () => toggleYield(!yieldEnabled))}
                    className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 border-2 ${
                      yieldEnabled
                        ? 'border-[#FF4444] text-[#FF4444] hover:bg-[#FF4444]/10'
                        : 'border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88]/10'
                    }`}
                  >
                    {isPending ? spinner : yieldEnabled ? 'DISABLE' : 'ENABLE'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
