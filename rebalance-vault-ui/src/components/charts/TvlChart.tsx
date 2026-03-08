'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Using realistic demo data for analytics charts
const generateTvlData = () => {
  const data = [];
  let base = 42000;
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    base += (Math.random() - 0.45) * 800;
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tvl: Math.max(base, 30000),
    });
  }
  return data;
};

const data = generateTvlData();

export function TvlChart() {
  return (
    <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">TVL Over Time</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" />
          <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ background: '#13131A', border: '1px solid #2D2D3D', borderRadius: '8px', color: '#F8FAFC' }}
            formatter={(v) => [`$${Number(v).toLocaleString()}`, 'TVL']}
          />
          <Area type="monotone" dataKey="tvl" stroke="#7C3AED" strokeWidth={2} fill="url(#tvlGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
