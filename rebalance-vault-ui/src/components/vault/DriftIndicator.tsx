'use client';

interface DriftIndicatorProps {
  driftBps: bigint;
  thresholdBps?: bigint;
}

export function DriftIndicator({ driftBps, thresholdBps = 100n }: DriftIndicatorProps) {
  const abs = driftBps < 0n ? -driftBps : driftBps;
  const driftNum = Number(abs);
  const pct = (driftNum / 100).toFixed(2);

  let color = 'bg-emerald-500';
  let label = 'Healthy';
  let textColor = 'text-emerald-400';
  let status: 'green' | 'yellow' | 'red' = 'green';

  if (driftNum > 300) {
    color = 'bg-rose-500';
    label = 'Critical';
    textColor = 'text-rose-400';
    status = 'red';
  } else if (driftNum > 100) {
    color = 'bg-yellow-400';
    label = 'Warning';
    textColor = 'text-yellow-400';
    status = 'yellow';
  }

  const barWidth = Math.min((driftNum / 500) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[#94A3B8] text-xs uppercase tracking-widest">Drift from Target</span>
        <span className={`text-sm font-mono font-bold ${textColor}`}>
          {driftBps < 0n ? '-' : '+'}{pct}% <span className="text-xs font-normal text-[#94A3B8]">({label})</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#2D2D3D] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-[#94A3B8]">
        <span>0 bps</span>
        <span className="text-yellow-400">⚠ {Number(thresholdBps)} bps</span>
        <span className="text-rose-400">🔴 300 bps</span>
      </div>
    </div>
  );
}
