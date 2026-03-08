'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: string;
  accent?: 'violet' | 'cyan' | 'coral' | 'lime' | 'green';
  className?: string;
}

const accentMap = {
  violet: 'border-t-violet-500',
  cyan: 'border-t-cyan-400',
  coral: 'border-t-rose-500',
  lime: 'border-t-lime-400',
  green: 'border-t-emerald-500',
};

export function StatCard({ label, value, subValue, accent = 'violet', className = '' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-[#1C1C28] border border-[#2D2D3D] border-t-2 ${accentMap[accent]} rounded-xl p-5 ${className}`}
    >
      <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-widest mb-2">{label}</p>
      <div className="text-white font-mono text-2xl font-bold leading-tight">{value}</div>
      {subValue && <p className="text-[#94A3B8] text-xs mt-1">{subValue}</p>}
    </motion.div>
  );
}
