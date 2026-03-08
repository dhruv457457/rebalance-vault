'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const generateDriftData = () => {
  const data = [];
  for (let i = 20; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const drift = (Math.random() - 0.5) * 600;
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      drift: parseFloat(drift.toFixed(1)),
    });
  }
  return data;
};

const data = generateDriftData();

function barColor(drift: number) {
  const abs = Math.abs(drift);
  if (abs > 300) return '#F43F5E';
  if (abs > 100) return '#F59E0B';
  return '#10B981';
}

export function DriftHistoryChart() {
  return (
    <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Drift History (bps)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" />
          <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} interval={3} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} bps`} />
          <Tooltip
            contentStyle={{ background: '#13131A', border: '1px solid #2D2D3D', borderRadius: '8px', color: '#F8FAFC' }}
            formatter={(v) => [`${Number(v)} bps`, 'Drift']}
          />
          <Bar dataKey="drift" radius={[4, 4, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={barColor(entry.drift)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Safe (&lt;100 bps)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" />Warning (100–300)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />Critical (&gt;300)</span>
      </div>
    </div>
  );
}
