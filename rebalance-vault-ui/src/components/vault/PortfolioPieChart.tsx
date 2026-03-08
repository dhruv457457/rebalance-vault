'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface PortfolioPieChartProps {
  ethValueUsd: bigint;
  usdcValueUsd: bigint;
  totalUsd: bigint;
  size?: 'sm' | 'lg';
}

const COLORS = ['#06B6D4', '#7C3AED'];

function formatPct(a: bigint, b: bigint): string {
  if (b === 0n) return '50.00';
  return ((Number(a) / Number(b)) * 100).toFixed(2);
}

export function PortfolioPieChart({ ethValueUsd, usdcValueUsd, totalUsd, size = 'lg' }: PortfolioPieChartProps) {
  const eth = Number(ethValueUsd);
  const usdc = Number(usdcValueUsd);
  const data = [
    { name: 'ETH', value: eth || 1 },
    { name: 'USDC', value: usdc || 1 },
  ];

  const ethPct = formatPct(ethValueUsd, totalUsd);
  const usdcPct = formatPct(usdcValueUsd, totalUsd);
  const outerRadius = size === 'lg' ? 130 : 70;
  const innerRadius = size === 'lg' ? 80 : 45;

  return (
    <div className="relative flex flex-col items-center">
      {/* Glow behind chart */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: outerRadius * 2 + 40,
          height: outerRadius * 2 + 40,
          background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.10) 60%, transparent 80%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <ResponsiveContainer width="100%" height={outerRadius * 2 + 40}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            strokeWidth={0}
            animationBegin={0}
            animationDuration={1200}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1C1C28', border: '1px solid #2D2D3D', borderRadius: '8px', color: '#F8FAFC' }}
            formatter={(value, name) => [`${((Number(value) / (eth + usdc || 1)) * 100).toFixed(2)}%`, String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[#94A3B8] text-xs uppercase tracking-widest">Allocation</span>
        <span className="font-mono text-white text-sm font-bold mt-0.5">50/50 Target</span>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />
          <span className="text-sm font-mono text-white">ETH <span className="text-cyan-400">{ethPct}%</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-violet-500 inline-block" />
          <span className="text-sm font-mono text-white">USDC <span className="text-violet-400">{usdcPct}%</span></span>
        </div>
      </div>
    </div>
  );
}
