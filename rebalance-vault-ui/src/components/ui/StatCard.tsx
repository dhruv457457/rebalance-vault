'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: string;
  accent?: 'lime' | 'purple' | 'cyan' | 'red' | 'green' | 'white';
  className?: string;
}

const accentColors: Record<string, string> = {
  lime: 'text-[#CAFF04]',
  purple: 'text-[#7B61FF]',
  cyan: 'text-[#00F0FF]',
  red: 'text-[#FF4444]',
  green: 'text-[#00FF88]',
  white: 'text-white',
};

export function StatCard({ label, value, subValue, accent = 'lime', className = '' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-[#111111] border border-[#1A1A1A] rounded-2xl p-5 card-hover ${className}`}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-3">{label}</p>
      <div className={`font-black text-2xl leading-none tabular ${accentColors[accent]}`}>{value}</div>
      {subValue && <p className="text-[#888] text-xs mt-2 uppercase tracking-wider font-bold">{subValue}</p>}
    </motion.div>
  );
}
