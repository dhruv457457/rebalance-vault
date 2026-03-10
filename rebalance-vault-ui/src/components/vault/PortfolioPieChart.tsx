'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface PortfolioPieChartProps {
  ethValueUsd: bigint;
  usdcValueUsd: bigint;
  totalUsd: bigint;
  size?: 'sm' | 'lg';
}

// DRIFT colors: lime for ETH, purple for USDC
const COLORS = ['#CAFF04', '#7B61FF'];

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
  const outerRadius = size === 'lg' ? 120 : 65;
  const innerRadius = size === 'lg' ? 72 : 40;
  const chartHeight = outerRadius * 2 + 32;

  return (
    <div className="relative flex flex-col items-center">
      {/* Glow behind chart */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: outerRadius * 2 + 60,
          height: outerRadius * 2 + 60,
          background: 'radial-gradient(circle, rgba(202,255,4,0.12) 0%, rgba(123,97,255,0.08) 50%, transparent 75%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -55%)',
        }}
      />

      <ResponsiveContainer width="100%" height={chartHeight}>
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
            contentStyle={{
              background: '#111111',
              border: '1px solid #1A1A1A',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
            formatter={(value, name) => [
              `${((Number(value) / (eth + usdc || 1)) * 100).toFixed(2)}%`,
              String(name),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ bottom: 32 }}>
        <span className="text-[#888] text-[10px] font-black uppercase tracking-widest">TARGET</span>
        <span className="font-black text-white text-sm mt-0.5">50/50</span>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#CAFF04' }} />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            ETH <span className="text-[#CAFF04]">{ethPct}%</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#7B61FF' }} />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            USDC <span className="text-[#7B61FF]">{usdcPct}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
