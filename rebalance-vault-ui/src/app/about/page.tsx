'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Price Oracle',
    desc: 'Chainlink price feed provides real-time ETH/USD price with staleness protection.',
    icon: '📡',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
  },
  {
    num: '02',
    title: 'Drift Check',
    desc: 'ThresholdStrategy calculates current ETH/USDC split vs 50% target. If drift > threshold, rebalance is triggered.',
    icon: '📊',
    color: 'text-violet-400',
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
  },
  {
    num: '03',
    title: 'Guard System',
    desc: 'Multi-layered safety: volatility check, rate limiter, swap size cap, circuit breaker.',
    icon: '🛡️',
    color: 'text-rose-400',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
  },
  {
    num: '04',
    title: 'Uniswap V3 Swap',
    desc: 'UniswapV3Adapter executes minimal swap to restore 50/50 balance with slippage protection.',
    icon: '⚡',
    color: 'text-lime-400',
    border: 'border-lime-500/30',
    bg: 'bg-lime-500/10',
  },
];

const facets = [
  { name: 'DiamondCutFacet', desc: 'Upgrades contract by adding/replacing/removing facets', color: '#7C3AED' },
  { name: 'DiamondLoupeFacet', desc: 'Introspection — lists all facets and selectors', color: '#06B6D4' },
  { name: 'VaultFacet', desc: 'Deposit, withdraw, portfolio value calculations', color: '#F43F5E' },
  { name: 'RebalanceFacet', desc: 'Rebalance logic, Chainlink automation, strategy execution', color: '#84CC16' },
  { name: 'GuardFacet', desc: 'Circuit breaker, volatility detection, rate limiting', color: '#F59E0B' },
  { name: 'YieldFacet', desc: 'Aave deposit/withdraw for idle USDC yield', color: '#10B981' },
  { name: 'StrategyFacet', desc: 'Pluggable rebalance strategies (Threshold, Band)', color: '#8B5CF6' },
  { name: 'FeeFacet', desc: 'Management & performance fee accounting', color: '#EC4899' },
];

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0A0A0F] grid-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="font-heading text-4xl font-bold text-white mb-4">How RebalanceVault Works</h1>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            An autonomous DeFi protocol built on the EIP-2535 Diamond proxy pattern. 
            Maintians a 50/50 ETH/USDC allocation, fully on-chain, with no human intervention required.
          </p>
        </motion.div>

        {/* 4-step flow */}
        <section className="mb-20">
          <h2 className="font-heading text-2xl font-bold text-white mb-8 text-center">Rebalance Flow</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-xl p-5 border ${s.border} ${s.bg}`}
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-2 text-[#2D2D3D] text-xl z-10">→</div>
                )}
                <div className="text-3xl mb-3">{s.icon}</div>
                <div className={`font-mono text-xs font-bold mb-1 ${s.color}`}>{s.num}</div>
                <h3 className={`font-heading font-bold text-base mb-2 ${s.color}`}>{s.title}</h3>
                <p className="text-[#94A3B8] text-xs leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Diamond architecture */}
        <section className="mb-20">
          <h2 className="font-heading text-2xl font-bold text-white mb-2 text-center">Diamond Architecture</h2>
          <p className="text-[#94A3B8] text-center text-sm mb-8">
            EIP-2535 Diamond Proxy — one address, multiple facets, infinitely upgradeable
          </p>

          {/* Diamond visual */}
          <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-violet-600/20 border-2 border-violet-500/50 text-3xl mb-3">◈</div>
              <div>
                <p className="font-mono text-violet-400 font-bold text-sm">Diamond Proxy</p>
                <p className="font-mono text-[#94A3B8] text-xs">0x26F9...503D</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {facets.map((f, i) => (
                <motion.div
                  key={f.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="rounded-xl p-3 border border-[#2D2D3D] bg-[#13131A] cursor-default group"
                  style={{ borderTopColor: f.color, borderTopWidth: 2 }}
                >
                  <p className="text-white text-xs font-bold mb-1 group-hover:text-violet-300 transition-colors">{f.name}</p>
                  <p className="text-[#94A3B8] text-xs leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Guard system */}
        <section className="mb-20">
          <h2 className="font-heading text-2xl font-bold text-white mb-8 text-center">Guard System — 4 Layers</h2>
          <div className="space-y-4">
            {[
              { layer: 'Layer 1', title: 'Volatility Detection', desc: 'Monitors ETH price change per block. If price moves > maxPriceChangeBps, trips circuit breaker to prevent rebalancing into volatile markets.', icon: '📉', color: 'text-rose-400' },
              { layer: 'Layer 2', title: 'Rate Limiter', desc: 'Caps maximum rebalances per block window. Prevents manipulation through rapid consecutive rebalances that could drain the vault.', icon: '⏱️', color: 'text-yellow-400' },
              { layer: 'Layer 3', title: 'Swap Size Cap', desc: 'Limits each swap to maxSwapSizeBps percentage of vault TVL. Protects against flash loan attacks and excessive slippage.', icon: '📏', color: 'text-cyan-400' },
              { layer: 'Layer 4', title: 'Circuit Breaker', desc: 'Last-resort safety valve. Can be tripped automatically by any guard layer or manually by owner. All rebalancing halts until reset.', icon: '🔌', color: 'text-violet-400' },
            ].map((g, i) => (
              <motion.div
                key={g.layer}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                className="flex gap-4 bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-5"
              >
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-[#13131A] text-2xl">{g.icon}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-mono font-bold ${g.color}`}>{g.layer}</span>
                    <span className="text-white font-semibold text-sm">{g.title}</span>
                  </div>
                  <p className="text-[#94A3B8] text-xs leading-relaxed">{g.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Strategy comparison */}
        <section>
          <h2 className="font-heading text-2xl font-bold text-white mb-8 text-center">Rebalance Strategies</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#1C1C28] border-2 border-violet-500/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-0.5 rounded text-xs bg-violet-600 text-white font-semibold">Active</span>
                <h3 className="font-heading text-lg font-bold text-white">ThresholdStrategy</h3>
              </div>
              <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">
                Triggers a rebalance when portfolio drift exceeds a fixed basis-point threshold. Simple, gas-efficient, and predictable.
              </p>
              <ul className="space-y-2 text-xs text-[#94A3B8]">
                <li className="flex gap-2"><span className="text-emerald-400">✓</span>Low complexity</li>
                <li className="flex gap-2"><span className="text-emerald-400">✓</span>Gas efficient</li>
                <li className="flex gap-2"><span className="text-emerald-400">✓</span>Deterministic triggers</li>
                <li className="flex gap-2"><span className="text-yellow-400">~</span>May over-rebalance in volatile markets</li>
              </ul>
            </div>
            <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-6 opacity-70">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-0.5 rounded text-xs bg-[#2D2D3D] text-[#94A3B8] font-semibold">Planned</span>
                <h3 className="font-heading text-lg font-bold text-white">BandStrategy</h3>
              </div>
              <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">
                Only rebalances when drift exits a configurable lower/upper band. Reduces rebalance frequency and slippage in ranging markets.
              </p>
              <ul className="space-y-2 text-xs text-[#94A3B8]">
                <li className="flex gap-2"><span className="text-emerald-400">✓</span>Fewer rebalances</li>
                <li className="flex gap-2"><span className="text-emerald-400">✓</span>Lower cumulative slippage</li>
                <li className="flex gap-2"><span className="text-emerald-400">✓</span>Configurable bands</li>
                <li className="flex gap-2"><span className="text-yellow-400">~</span>More complex tuning required</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
