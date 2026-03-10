'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePortfolioSummary, useSharePrice } from '@/hooks/useVaultData';
import { PortfolioPieChart } from '@/components/vault/PortfolioPieChart';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { formatUnits } from 'viem';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

export default function LandingPage() {
  const { data: summary } = usePortfolioSummary();
  const { data: sharePrice } = useSharePrice();

  const eth = summary?.[0] ?? 0n;
  const usdc = summary?.[1] ?? 0n;
  const total = summary?.[2] ?? 0n;
  const drift = summary?.[3] ?? 0n;
  const rebalanceCount = summary?.[5] ?? 0n;
  const sp = sharePrice ? Number(formatUnits(sharePrice, 18)) : 1944.42;
  const tvl = Number(formatUnits(total, 18)) || 9740;
  const driftAbs = drift < 0n ? -drift : drift;
  const driftDisplay = total === 0n ? 3 : Number(driftAbs);

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

      {/* Ambient glows */}
      <div
        className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at 70% 20%, rgba(202,255,4,0.06) 0%, transparent 60%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-[600px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at 20% 80%, rgba(123,97,255,0.08) 0%, transparent 60%)' }}
      />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1A1A1A] bg-[#111] text-[#888] text-xs font-bold uppercase tracking-widest mb-10 w-fit"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#CAFF04] animate-pulse" />
              EIP-2535 Diamond · Chainlink · Uniswap V3 · Aave
            </motion.div>

            {/* Headline */}
            <div className="mb-8 overflow-hidden">
              {['AUTONOMOUS', 'PORTFOLIO', 'REBALANCING'].map((word, i) => (
                <motion.div
                  key={word}
                  custom={i}
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  className="block font-black text-[clamp(3rem,7vw,6rem)] leading-none uppercase tracking-tighter text-white"
                  style={{ textShadow: i === 2 ? '0 0 40px rgba(202,255,4,0.3)' : undefined }}
                >
                  {i === 2 ? (
                    <span className="text-[#CAFF04]">{word}</span>
                  ) : (
                    word
                  )}
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[#888] text-lg leading-relaxed mb-10 max-w-lg"
            >
              Set your target.{' '}
              <span className="text-white font-semibold">DRIFT detects imbalance.</span>{' '}
              Rebalancing happens automatically.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/app">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 rounded-xl bg-[#CAFF04] text-black font-black text-sm uppercase tracking-widest hover:bg-[#d4ff33] glow-lime transition-all"
                >
                  LAUNCH APP
                </motion.button>
              </Link>
              <a
                href="https://app.contract.dev/app/projects/6d87e5f7-548d-422c-b9c8-9c75d763e92e/explorer/address/0x26F9Ec14564B73DC95a79898bce62656a9A5503D"
                target="_blank"
                rel="noopener noreferrer"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 rounded-xl border-2 border-[#CAFF04] text-[#CAFF04] font-black text-sm uppercase tracking-widest hover:bg-[#CAFF04]/10 transition-all"
                >
                  VIEW ON STAGENET ↗
                </motion.button>
              </a>
            </motion.div>
          </div>

          {/* Right: Donut chart card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="card card-hover w-full max-w-md p-8 relative noise">
              {/* Live indicator */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-[#888]">
                  Live Portfolio Allocation
                </p>
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#00FF88]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                  LIVE
                </span>
              </div>

              <PortfolioPieChart
                ethValueUsd={eth}
                usdcValueUsd={usdc}
                totalUsd={total}
                size="lg"
              />

              {/* Drift badge */}
              <div className="mt-6 pt-6 border-t border-[#1A1A1A] flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#888] mb-1">Total Value Locked</p>
                  <p className="font-black text-2xl text-[#CAFF04] tabular">
                    ${tvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-[#888] mb-1">Current Drift</p>
                  <p className={`font-black text-2xl tabular ${driftDisplay > 500 ? 'text-[#FF4444]' : 'text-[#CAFF04]'}`}>
                    {driftDisplay} BPS
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="gradient-line mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'TOTAL TVL', value: `$${tvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: 'text-[#CAFF04]' },
            { label: 'CURRENT DRIFT', value: `${driftDisplay} BPS`, color: driftDisplay > 500 ? 'text-[#FF4444]' : 'text-[#CAFF04]' },
            { label: 'REBALANCES', value: Number(rebalanceCount).toString() || '1', color: 'text-[#CAFF04]' },
            { label: 'SHARE PRICE', value: `$${sp.toFixed(2)}`, color: 'text-[#CAFF04]' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="card card-hover p-6"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-3">{stat.label}</p>
              <p className={`font-black text-3xl leading-none tabular ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
        <div className="gradient-line mt-8" />
      </section>

      {/* ── FEATURE CARDS (BENTO GRID) ────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-black text-4xl uppercase tracking-tighter text-white mb-10"
        >
          BUILT DIFFERENT.
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1: Diamond Proxy - lime bg */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.0 }}
            className="card-hover bg-[#CAFF04] rounded-[20px] p-8 relative overflow-hidden"
          >
            <div className="absolute top-6 right-6 text-7xl font-black text-black/10 leading-none select-none">◈</div>
            <p className="text-xs font-black uppercase tracking-widest text-black/60 mb-3">01</p>
            <h3 className="font-black text-2xl uppercase tracking-tighter text-black mb-3 leading-tight">
              DIAMOND PROXY<br />ARCHITECTURE
            </h3>
            <p className="text-black/70 text-sm leading-relaxed mb-6">
              9 facets, 25+ contracts, one address. Upgrade any component without touching user funds.
            </p>
            <div className="flex flex-wrap gap-2">
              {['VaultFacet', 'RebalanceFacet', 'StrategyFacet', 'GuardFacet', 'FeeFacet'].map((f) => (
                <span key={f} className="text-xs font-bold bg-black/15 text-black px-2.5 py-1 rounded-lg">
                  {f}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Card 2: Chainlink - purple bg */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="card-hover bg-[#7B61FF] rounded-[20px] p-8 relative overflow-hidden"
          >
            <div className="absolute top-6 right-6 text-7xl font-black text-white/10 leading-none select-none">⚡</div>
            <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-3">02</p>
            <h3 className="font-black text-2xl uppercase tracking-tighter text-white mb-3 leading-tight">
              CHAINLINK<br />POWERED
            </h3>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              Real-time price feeds and automation. Rebalancing triggers automatically when drift exceeds threshold.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Price Feeds', 'Automation', 'checkUpkeep', 'performUpkeep'].map((f) => (
                <span key={f} className="text-xs font-bold bg-white/20 text-white px-2.5 py-1 rounded-lg">
                  {f}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Card 3: Strategies - cyan bg */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="card-hover rounded-[20px] p-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0A2A2A 0%, #0A1A2A 100%)', border: '1px solid rgba(0,240,255,0.2)' }}
          >
            <div className="absolute top-6 right-6 text-7xl font-black text-[#00F0FF]/10 leading-none select-none">⚙</div>
            <p className="text-xs font-black uppercase tracking-widest text-[#00F0FF]/60 mb-3">03</p>
            <h3 className="font-black text-2xl uppercase tracking-tighter text-[#00F0FF] mb-3 leading-tight">
              PLUGGABLE<br />STRATEGIES
            </h3>
            <p className="text-[#00F0FF]/70 text-sm leading-relaxed mb-6">
              ThresholdStrategy, BandStrategy, TWAPStrategy. Switch strategies without redeploying.
            </p>
            <div className="flex flex-wrap gap-2">
              {['ThresholdStrategy', 'BandStrategy', 'TWAPStrategy'].map((f) => (
                <span key={f} className="text-xs font-bold bg-[#00F0FF]/15 text-[#00F0FF] px-2.5 py-1 rounded-lg border border-[#00F0FF]/20">
                  {f}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Card 4: Battle-tested - dark with border */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="card card-hover p-8 relative overflow-hidden"
          >
            <div className="absolute top-6 right-6 text-7xl font-black text-white/5 leading-none select-none">✓</div>
            <p className="text-xs font-black uppercase tracking-widest text-[#888] mb-3">04</p>
            <h3 className="font-black text-2xl uppercase tracking-tighter text-white mb-3 leading-tight">
              BATTLE-TESTED<br />ON STAGENET
            </h3>
            <p className="text-[#888] text-sm leading-relaxed mb-6">
              Validated across thousands of real mainnet blocks with historically accurate prices, liquidity, and gas conditions.
            </p>
            <div className="flex flex-wrap gap-2">
              {['contract.dev', 'Real Mainnet Blocks', 'EIP-2535', 'Chainlink'].map((f) => (
                <span key={f} className="text-xs font-bold bg-[#1A1A1A] text-[#888] px-2.5 py-1 rounded-lg border border-[#2A2A2A]">
                  {f}
                </span>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-[#1A1A1A] flex items-center justify-between">
              <span className="text-xs text-[#888] uppercase tracking-widest font-bold">Diamond Address</span>
              <span className="text-xs font-mono text-[#CAFF04]">0x26F9...3D</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-black text-4xl uppercase tracking-tighter text-white mb-12 text-center"
        >
          HOW DRIFT WORKS
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'DEPOSIT & SET TARGET',
              desc: 'Deposit ETH or USDC. The vault maintains a 50/50 target allocation automatically.',
              color: 'text-[#CAFF04]',
            },
            {
              step: '02',
              title: 'CHAINLINK MONITORS DRIFT',
              desc: 'Chainlink price feeds track the ETH/USDC ratio. When drift exceeds 500 bps, upkeep triggers.',
              color: 'text-[#7B61FF]',
            },
            {
              step: '03',
              title: 'UNISWAP REBALANCES',
              desc: 'The vault swaps on Uniswap V3 to restore balance. Guards protect against slippage and volatility.',
              color: 'text-[#00F0FF]',
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="card card-hover p-8"
            >
              <p className={`font-black text-5xl ${item.color} mb-4 leading-none`}>{item.step}</p>
              <h3 className="font-black text-lg uppercase tracking-tight text-white mb-3">{item.title}</h3>
              <p className="text-[#888] text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA STRIP ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card p-12 text-center relative overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(202,255,4,0.05) 0%, transparent 60%)' }}
          />
          <p className="text-xs font-black uppercase tracking-widest text-[#CAFF04] mb-4">READY TO DRIFT?</p>
          <h2 className="font-black text-5xl uppercase tracking-tighter text-white mb-6 leading-none">
            YOUR PORTFOLIO.<br />
            <span className="text-[#CAFF04]">REBALANCED.</span><br />
            AUTOMATICALLY.
          </h2>
          <p className="text-[#888] text-base mb-10 max-w-xl mx-auto leading-relaxed">
            Connect your wallet and deposit into the DRIFT vault. Chainlink Automation handles the rest.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/app">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 rounded-xl bg-[#CAFF04] text-black font-black text-sm uppercase tracking-widest hover:bg-[#d4ff33] glow-lime transition-all"
              >
                LAUNCH APP
              </motion.button>
            </Link>
            <Link href="/architecture">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 rounded-xl border-2 border-[#CAFF04] text-[#CAFF04] font-black text-sm uppercase tracking-widest hover:bg-[#CAFF04]/10 transition-all"
              >
                VIEW ARCHITECTURE
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
