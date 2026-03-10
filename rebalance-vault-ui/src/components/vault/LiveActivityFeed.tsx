'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ActivityType = 'rebalance' | 'deposit' | 'withdraw' | 'guard';

interface ActivityItem {
  id: string;
  type: ActivityType;
  block: string;
  message: string;
  amount: string;
  drift: string;
  gas: string;
}

const typeConfig: Record<ActivityType, { label: string; color: string; bg: string; border: string }> = {
  rebalance: { label: 'performUpkeep', color: 'text-[#CAFF04]', bg: 'bg-[#CAFF04]/5', border: 'border-[#CAFF04]/20' },
  deposit: { label: 'deposit', color: 'text-[#7B61FF]', bg: 'bg-[#7B61FF]/5', border: 'border-[#7B61FF]/20' },
  withdraw: { label: 'withdraw', color: 'text-[#FF4444]', bg: 'bg-[#FF4444]/5', border: 'border-[#FF4444]/20' },
  guard: { label: 'guardCheck', color: 'text-[#00FF88]', bg: 'bg-[#00FF88]/5', border: 'border-[#00FF88]/20' },
};

function generateActivity(): ActivityItem[] {
  return [
    {
      id: '1',
      type: 'rebalance',
      block: '#24613285',
      message: 'Sold 2.5 ETH → USDC',
      amount: '2.5 ETH',
      drift: '5000 → 3 bps',
      gas: '403K',
    },
    {
      id: '2',
      type: 'deposit',
      block: '#24613282',
      message: 'Deposit from 0xF8A4...BCCC',
      amount: '5.0 ETH',
      drift: '—',
      gas: '156K',
    },
    {
      id: '3',
      type: 'guard',
      block: '#24613280',
      message: 'Volatility check passed',
      amount: '—',
      drift: '—',
      gas: '21K',
    },
    {
      id: '4',
      type: 'rebalance',
      block: '#24612900',
      message: 'Sold 820 USDC → ETH',
      amount: '820 USDC',
      drift: '650 → 12 bps',
      gas: '391K',
    },
    {
      id: '5',
      type: 'deposit',
      block: '#24612850',
      message: 'Deposit from 0x8Da9...3B41',
      amount: '100 USDC',
      drift: '—',
      gas: '148K',
    },
  ];
}

export function LiveActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>(generateActivity);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems(generateActivity());
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-sm uppercase tracking-widest text-[#888]">Recent Transactions</h3>
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#00FF88]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-5 gap-3 mb-3 pb-2 border-b border-[#1A1A1A]">
        {['TYPE', 'BLOCK', 'AMOUNT', 'DRIFT BEFORE→AFTER', 'GAS'].map((col) => (
          <p key={col} className="text-[10px] font-black uppercase tracking-widest text-[#888]">
            {col}
          </p>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {items.map((item, i) => {
            const cfg = typeConfig[item.type];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ delay: i * 0.04 }}
                className={`grid grid-cols-5 gap-3 py-3 px-3 rounded-xl border ${cfg.bg} ${cfg.border} ${i % 2 === 0 ? '' : 'bg-opacity-50'}`}
              >
                <span className={`font-mono text-xs font-black ${cfg.color}`}>{cfg.label}</span>
                <span className="font-mono text-xs text-[#888]">{item.block}</span>
                <span className="font-mono text-xs text-white">{item.amount}</span>
                <span className="font-mono text-xs text-[#888]">{item.drift}</span>
                <span className="font-mono text-xs text-[#888]">{item.gas}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
