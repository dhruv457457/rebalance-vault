'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ActivityType = 'rebalance' | 'deposit' | 'withdraw' | 'guard';

interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  time: string;
}

const typeStyles: Record<ActivityType, { icon: string; border: string; bg: string }> = {
  rebalance: { icon: '⚡', border: 'border-violet-500', bg: 'bg-violet-500/10' },
  deposit: { icon: '📥', border: 'border-cyan-500', bg: 'bg-cyan-500/10' },
  withdraw: { icon: '📤', border: 'border-rose-500', bg: 'bg-rose-500/10' },
  guard: { icon: '🛡️', border: 'border-emerald-500', bg: 'bg-emerald-500/10' },
};

// Generates realistic-looking simulated activity for demo purposes
function generateActivity(): ActivityItem[] {
  const now = new Date();
  return [
    { id: '1', type: 'rebalance', message: 'Rebalanced — sold 2.5 ETH for 4,857 USDC', time: formatTime(new Date(now.getTime() - 30000)) },
    { id: '2', type: 'deposit', message: 'Deposit — 0.5 ETH from 0xF8A4...BCCC', time: formatTime(new Date(now.getTime() - 95000)) },
    { id: '3', type: 'guard', message: 'Guard — volatility check passed', time: formatTime(new Date(now.getTime() - 180000)) },
    { id: '4', type: 'rebalance', message: 'Rebalanced — sold 820 USDC for 0.41 ETH', time: formatTime(new Date(now.getTime() - 300000)) },
    { id: '5', type: 'deposit', message: 'Deposit — 100 USDC from 0x8Da9...3B41', time: formatTime(new Date(now.getTime() - 450000)) },
  ];
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
    <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="text-xl">📡</span> Live Activity
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#2D2D3D]">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const styles = typeStyles[item.type];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`flex gap-3 p-3 rounded-lg border-l-2 ${styles.border} ${styles.bg}`}
              >
                <span className="text-base">{styles.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs leading-relaxed">{item.message}</p>
                  <p className="text-[#94A3B8] text-xs mt-0.5">{item.time}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
