'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDeposit } from '@/hooks/useDeposit';
import { parseContractError } from '@/lib/errors';

export function DepositForm() {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'eth' | 'usdc'>('eth');
  const { depositEth, depositUsdc, isPending, isSuccess } = useDeposit();
  const [txError, setTxError] = useState<{ message: string; hint?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTxError(null);
    try {
      if (mode === 'eth') await depositEth(amount);
      else await depositUsdc(amount);
      setAmount('');
    } catch (err: unknown) {
      setTxError(parseContractError(err));
    }
  }

  return (
    <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">📥</span> Deposit
      </h3>

      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden border border-[#2D2D3D] mb-4">
        {(['eth', 'usdc'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${
              mode === m ? 'bg-violet-600 text-white' : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="number"
            step="any"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={mode === 'eth' ? '0.0 ETH' : '0.0 USDC'}
            className="w-full bg-[#13131A] border border-[#2D2D3D] rounded-lg px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-violet-500 transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm font-semibold">
            {mode.toUpperCase()}
          </span>
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
          <p className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            ✓ Deposit confirmed!
          </p>
        )}

        <motion.button
          type="submit"
          disabled={isPending || !amount}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-wider transition-all"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Confirming...
            </span>
          ) : `Deposit ${mode.toUpperCase()}`}
        </motion.button>
      </form>
    </div>
  );
}
