'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const generateShareData = () => {
  const data = [];
  let price = 1.0;
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    price *= 1 + (Math.random() - 0.47) * 0.008;
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: parseFloat(price.toFixed(6)),
    });
  }
  return data;
};

const data = generateShareData();

export function SharePriceChart() {
  return (
    <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Share Price History</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" />
          <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(4)}`} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#13131A', border: '1px solid #2D2D3D', borderRadius: '8px', color: '#F8FAFC' }}
            formatter={(v) => [`$${Number(v).toFixed(6)}`, 'Share Price']}
          />
          <Line type="monotone" dataKey="price" stroke="#06B6D4" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
