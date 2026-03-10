'use client';

import { motion } from 'framer-motion';

interface DriftIndicatorProps {
  driftBps: bigint;
  thresholdBps?: bigint;
}

export function DriftIndicator({ driftBps, thresholdBps = 500n }: DriftIndicatorProps) {
  const driftNum = Number(driftBps);
  const threshold = Number(thresholdBps);
  const pct = (driftNum / 100).toFixed(2);

  const isAbove = driftNum > threshold;
  const isCritical = driftNum > threshold * 2;

  const driftColor = isCritical ? 'text-[#FF4444]' : isAbove ? 'text-[#FF4444]' : 'text-[#CAFF04]';
  const barColor = isCritical ? '#FF4444' : isAbove ? '#FF4444' : '#CAFF04';
  const barWidth = Math.min((driftNum / (threshold * 2)) * 100, 100);
  const thresholdMark = Math.min((threshold / (threshold * 2)) * 100, 100); // = 50%

  const status = isCritical ? 'REBALANCE TRIGGERED' : isAbove ? 'ABOVE THRESHOLD' : 'WITHIN THRESHOLD ✓';
  const statusColor = isAbove ? 'text-[#FF4444]' : 'text-[#00FF88]';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-[#888]">Drift from Target</p>
        <div className="flex items-center gap-2">
          <span className={`font-black text-2xl tabular leading-none ${driftColor} ${isAbove ? 'pulse-red' : ''}`}>
            {driftNum} BPS
          </span>
          <span className="text-xs text-[#888]">({pct}%)</span>
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-3 rounded-full bg-[#0A0A0A] border border-[#1A1A1A] overflow-visible">
        {/* Threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-px z-10"
          style={{ left: `${thresholdMark}%`, background: 'rgba(255,255,255,0.3)' }}
        />
        {/* Fill */}
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            background: `linear-gradient(90deg, ${barColor}80, ${barColor})`,
            boxShadow: isAbove ? `0 0 8px ${barColor}80` : undefined,
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-[#888]">0 BPS</span>
        <span className="text-[#888]">THRESHOLD: {threshold} BPS</span>
        <span className="text-[#888]">{threshold * 2} BPS</span>
      </div>

      {/* Status badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-widest ${
        isAbove
          ? 'bg-[#FF4444]/10 border-[#FF4444]/30 text-[#FF4444]'
          : 'bg-[#00FF88]/10 border-[#00FF88]/30 text-[#00FF88]'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isAbove ? 'bg-[#FF4444] animate-ping' : 'bg-[#00FF88]'}`} />
        {status}
      </div>
    </div>
  );
}
