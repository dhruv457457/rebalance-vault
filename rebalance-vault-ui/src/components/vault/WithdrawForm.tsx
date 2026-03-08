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
    <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-5 mt-4">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">📤</span> Withdraw
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-[#94A3B8] text-xs">Withdraw {pct}% of your shares</span>
            <span className="text-white font-mono text-xs">
              {shares ? Number(formatUnits(sharesToWithdraw, 18)).toFixed(4) : '0.0000'} shares
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-xs text-[#94A3B8] mt-1">
            <span>1%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        {txError && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            <p className="text-rose-400 text-xs font-medium">⚠ {txError.message}</p>
            {txError.hint && (
              <p className="text-rose-300/70 text-xs mt-1 leading-relaxed">{txError.hint}</p>
            )}
          </div>
        )}
        {isSuccess && (
          <p className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">✓ Withdrawal confirmed!</p>
        )}

        <motion.button
          onClick={handleWithdraw}
          disabled={isPending || !shares || shares === 0n}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-wider transition-all"
        >
          {isPending ? 'Confirming...' : `Withdraw ${pct}%`}
        </motion.button>

        {/* Emergency withdraw */}
        <div>
          <button
            onClick={() => setShowEmergency(!showEmergency)}
            className="text-xs text-[#94A3B8] hover:text-rose-400 transition-colors flex items-center gap-1"
          >
            ⚠ Emergency Withdraw
          </button>
          {showEmergency && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2"
            >
              <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 mb-2">
                Warning: Emergency withdraw bypasses normal checks. Use only in extreme situations.
              </p>
              <button
                onClick={handleEmergency}
                disabled={isPending}
                className="w-full py-2 rounded-lg border border-rose-500/50 text-rose-400 text-xs hover:bg-rose-500/10 disabled:opacity-50 transition-all"
              >
                {isPending ? 'Processing...' : 'Confirm Emergency Withdraw'}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
