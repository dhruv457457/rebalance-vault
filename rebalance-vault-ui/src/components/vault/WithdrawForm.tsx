'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWithdraw } from '@/hooks/useWithdraw';
import { useUserPosition } from '@/hooks/useUserPosition';
import { formatUnits } from 'viem';
import { parseContractError } from '@/lib/errors';

export function WithdrawForm() {
  const [pct, setPct] = useState(50);
  const [showEmergency, setShowEmergency] = useState(false);
  const { withdraw, emergencyWithdraw, isPending, isSuccess } = useWithdraw();
  const { shares } = useUserPosition();
  const [txError, setTxError] = useState<{ message: string; hint?: string } | null>(null);

  const sharesToWithdraw = shares ? (shares * BigInt(pct)) / 100n : 0n;

  async function handleWithdraw() {
    setTxError(null);
    try {
      await withdraw(sharesToWithdraw);
    } catch (err: unknown) {
      setTxError(parseContractError(err));
    }
  }

  async function handleEmergency() {
    setTxError(null);
    try {
      await emergencyWithdraw();
    } catch (err: unknown) {
      setTxError(parseContractError(err));
    }
  }

  return (
    <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-5">
      <h3 className="font-black text-sm uppercase tracking-widest text-[#888] mb-4">Withdraw</h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#888]">
              WITHDRAW {pct}%
            </span>
            <span className="font-mono text-xs text-white font-bold">
              {shares ? Number(formatUnits(sharesToWithdraw, 18)).toFixed(4) : '0.0000'} shares
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#CAFF04' }}
          />
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#888] mt-1.5">
            <span>1%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {txError && (
          <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-xl px-4 py-3">
            <p className="text-[#FF4444] text-xs font-bold">{txError.message}</p>
            {txError.hint && (
              <p className="text-[#FF4444]/60 text-xs mt-1 leading-relaxed">{txError.hint}</p>
            )}
          </div>
        )}

        {isSuccess && (
          <p className="text-[#00FF88] text-xs bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-xl px-4 py-3 font-bold">
            ✓ WITHDRAWAL CONFIRMED
          </p>
        )}

        <motion.button
          onClick={handleWithdraw}
          disabled={isPending || !shares || shares === 0n}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 rounded-xl border-2 border-[#CAFF04] text-[#CAFF04] font-black text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#CAFF04]/10 transition-all"
        >
          {isPending ? 'CONFIRMING...' : `WITHDRAW ${pct}%`}
        </motion.button>

        {/* Emergency withdraw */}
        <div>
          <button
            onClick={() => setShowEmergency(!showEmergency)}
            className="text-[10px] font-black uppercase tracking-widest text-[#888] hover:text-[#FF4444] transition-colors"
          >
            ⚠ EMERGENCY WITHDRAW
          </button>
          {showEmergency && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3"
            >
              <p className="text-xs text-[#FF4444]/80 bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-xl px-3 py-2 mb-2 leading-relaxed">
                Emergency withdraw bypasses normal checks. Use only in extreme situations.
              </p>
              <button
                onClick={handleEmergency}
                disabled={isPending}
                className="w-full py-2.5 rounded-xl border border-[#FF4444]/50 text-[#FF4444] text-xs font-black uppercase tracking-widest hover:bg-[#FF4444]/10 disabled:opacity-40 transition-all"
              >
                {isPending ? 'PROCESSING...' : 'CONFIRM EMERGENCY WITHDRAW'}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
