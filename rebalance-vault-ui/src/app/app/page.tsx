'use client';

import { motion } from 'framer-motion';
import { useAccount, useConnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useVaultData } from '@/hooks/useVaultData';
import { useUserPosition } from '@/hooks/useUserPosition';
import { PortfolioPieChart } from '@/components/vault/PortfolioPieChart';
import { DriftIndicator } from '@/components/vault/DriftIndicator';
import { DepositForm } from '@/components/vault/DepositForm';
import { WithdrawForm } from '@/components/vault/WithdrawForm';
import { RebalanceStats } from '@/components/vault/RebalanceStats';
import { LiveActivityFeed } from '@/components/vault/LiveActivityFeed';
import { GuardPanel } from '@/components/vault/GuardPanel';
import { YieldPanel } from '@/components/vault/YieldPanel';
import { FeePanel } from '@/components/vault/FeePanel';
import { VaultConfig } from '@/components/vault/VaultConfig';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { AddressLink } from '@/components/ui/AddressLink';
import { stagenet } from '@/lib/wagmi';
import { formatUnits } from 'viem';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06 },
  }),
};

export default function AppPage() {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { switchChain } = useSwitchChain();

  const { summary, sharePrice, rebalanceStats, vaultConfig, feeInfo, guardStatus, yieldInfo, isLoading } = useVaultData();
  const { shares, ethValue, usdcValue } = useUserPosition();

  const wrongNetwork = isConnected && chain?.id !== stagenet.id;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] dot-grid flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-12 text-center max-w-md w-full mx-4"
        >
          <div className="text-6xl text-[#CAFF04] mb-6">◈</div>
          <h2 className="font-black text-2xl uppercase tracking-tighter text-white mb-2">
            Connect Wallet
          </h2>
          <p className="text-[#888] text-sm mb-8 leading-relaxed">
            Connect to access the DRIFT Protocol dashboard
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => connect({ connector: injected() })}
            className="w-full px-8 py-4 rounded-xl bg-[#CAFF04] text-black font-black text-sm uppercase tracking-widest hover:bg-[#d4ff33] transition-all"
          >
            CONNECT WALLET
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Parse data
  const eth = summary?.[0] ?? 0n;
  const usdc = summary?.[1] ?? 0n;
  const total = summary?.[2] ?? 0n;
  const drift = summary?.[3] ?? 0n;
  const rebalanceCount = summary?.[5] ?? 0n;
  const paused = summary?.[7] ?? false;
  const tvl = Number(formatUnits(total, 18));
  const sp = sharePrice ? Number(formatUnits(sharePrice, 18)) : 0;
  const driftAbs = drift < 0n ? -drift : drift;
  const driftNum = Number(driftAbs);
  const isAboveThreshold = driftNum > 500;

  // Rebalance stats
  const [rbCount, lastBlock, , volumeWei, gasUsed, slippageWei] = rebalanceStats ?? [0n, 0n, 0n, 0n, 0n, 0n];
  const volumeEth = Number(formatUnits(volumeWei ?? 0n, 18));
  const slippageUsd = Number(formatUnits(slippageWei ?? 0n, 18));

  // Vault config
  const driftThresholdBps = vaultConfig?.[1] ?? 500n;
  const minInterval = vaultConfig?.[3] ?? 10n;
  const activeStrategyAddr = vaultConfig?.[4] ?? '';

  // Fee info
  const [mgmtBps, perfBps, hwm, accruedFees] = feeInfo ?? [200n, 2000n, 0n, 0n];

  // Guard
  const [cbTripped, maxPriceChangeBps, , rebalsInWindow, maxRebals, maxSwapBps] = guardStatus ?? [false, 1000n, 0n, 0n, 5n, 2500n];

  // User position
  const userShares = shares ? Number(formatUnits(shares, 18)) : 0;
  const userEth = ethValue ? Number(formatUnits(ethValue, 18)) : 0;
  const userUsdc = usdcValue ? Number(formatUnits(usdcValue, 18)) : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {wrongNetwork && (
        <div className="sticky top-16 z-40 bg-[#FF4444]/10 border-b border-[#FF4444]/30 text-[#FF4444] text-xs font-bold uppercase tracking-widest text-center py-2.5 flex items-center justify-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4444] animate-pulse" />
          SWITCH TO STAGENET
          <button onClick={() => switchChain({ chainId: stagenet.id })} className="px-3 py-1 rounded-lg bg-[#FF4444] text-black font-black text-xs">
            SWITCH
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-black text-3xl uppercase tracking-tighter text-white">DASHBOARD</h1>
            <p className="text-[#888] text-xs mt-1 font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)} · Stagenet
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLoading && (
              <span className="text-xs text-[#888] uppercase tracking-widest">Syncing...</span>
            )}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-widest ${
              paused
                ? 'bg-[#FF4444]/10 border-[#FF4444]/30 text-[#FF4444]'
                : 'bg-[#00FF88]/10 border-[#00FF88]/30 text-[#00FF88]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-[#FF4444]' : 'bg-[#00FF88] animate-pulse'}`} />
              {paused ? 'PAUSED' : 'LIVE'}
            </div>
          </div>
        </div>

        {/* ── Rebalance Stats Strip ─────────────────────── */}
        <motion.section
          custom={0}
          initial="hidden"
          animate="show"
          variants={cardVariants}
          className="mb-6"
        >
          <RebalanceStats />
        </motion.section>

        {/* ── Main Grid ────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Portfolio Overview (2-col span) */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="show"
            variants={cardVariants}
            className="lg:col-span-2 card card-hover p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-black text-xl uppercase tracking-tighter text-white">Portfolio Overview</h2>
                <p className="text-xs uppercase tracking-widest text-[#888] mt-0.5">ETH / USDC allocation</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-[#888] mb-1">Total Value</p>
                <p className="font-black text-3xl text-[#CAFF04] tabular leading-none">
                  ${tvl.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <PortfolioPieChart ethValueUsd={eth} usdcValueUsd={usdc} totalUsd={total} size="sm" />

              <div className="flex flex-col justify-center space-y-3">
                <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-4">
                  <p className="text-xs uppercase tracking-widest text-[#888] mb-1">ETH Value</p>
                  <p className="font-black text-xl text-[#CAFF04] tabular">
                    $<AnimatedNumber value={Number(formatUnits(eth, 18))} decimals={2} />
                  </p>
                </div>
                <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-4">
                  <p className="text-xs uppercase tracking-widest text-[#888] mb-1">USDC Value</p>
                  <p className="font-black text-xl text-[#7B61FF] tabular">
                    $<AnimatedNumber value={Number(formatUnits(usdc, 18))} decimals={2} />
                  </p>
                </div>
                <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-4">
                  <p className="text-xs uppercase tracking-widest text-[#888] mb-1">Share Price</p>
                  <p className="font-black text-xl text-white tabular">
                    $<AnimatedNumber value={sp} decimals={4} />
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <DriftIndicator driftBps={driftAbs} thresholdBps={driftThresholdBps} />
            </div>
          </motion.div>

          {/* Right column: User position + forms */}
          <div className="space-y-4">
            <motion.div
              custom={2}
              initial="hidden"
              animate="show"
              variants={cardVariants}
              className="card p-5"
            >
              <h2 className="font-black text-sm uppercase tracking-widest text-[#888] mb-4">Your Position</h2>
              <div className="space-y-2">
                {[
                  { label: 'SHARES', value: userShares.toFixed(4), color: 'text-white' },
                  { label: 'ETH VALUE', value: `$${userEth.toFixed(4)}`, color: 'text-[#CAFF04]' },
                  { label: 'USDC VALUE', value: `$${userUsdc.toFixed(2)}`, color: 'text-[#7B61FF]' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-[#1A1A1A] last:border-0">
                    <span className="text-xs uppercase tracking-widest text-[#888] font-bold">{row.label}</span>
                    <span className={`font-mono text-sm font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div custom={3} initial="hidden" animate="show" variants={cardVariants}>
              <DepositForm />
            </motion.div>
            <motion.div custom={4} initial="hidden" animate="show" variants={cardVariants}>
              <WithdrawForm />
            </motion.div>
          </div>
        </div>

        {/* ── Bento Grid: Stats + Strategy + Guard + Fee ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

          {/* Vault Stats */}
          <motion.div custom={5} initial="hidden" animate="show" variants={cardVariants} className="card card-hover p-6 lg:col-span-2">
            <h3 className="font-black text-sm uppercase tracking-widest text-[#888] mb-5">Vault Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'REBALANCES', value: Number(rbCount).toString(), color: 'text-[#CAFF04]' },
                { label: 'LAST BLOCK', value: lastBlock && lastBlock > 0n ? `#${Number(lastBlock).toLocaleString()}` : '—', color: 'text-white' },
                { label: 'VOLUME', value: `${volumeEth.toFixed(3)} ETH`, color: 'text-[#CAFF04]' },
                { label: 'GAS USED', value: Number(gasUsed ?? 0n).toLocaleString(), color: 'text-white' },
                { label: 'SLIPPAGE', value: `$${slippageUsd.toFixed(4)}`, color: 'text-white' },
                { label: 'TARGET', value: '50/50', color: 'text-[#7B61FF]' },
              ].map((s) => (
                <div key={s.label} className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-3">
                  <p className="text-xs uppercase tracking-widest text-[#888] mb-1 font-bold">{s.label}</p>
                  <p className={`font-black text-lg tabular leading-none ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Strategy Card */}
          <motion.div custom={6} initial="hidden" animate="show" variants={cardVariants} className="card card-hover p-6">
            <h3 className="font-black text-sm uppercase tracking-widest text-[#888] mb-5">Strategy</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#CAFF04] pulse-glow" />
              <span className="font-black text-sm text-[#CAFF04] uppercase tracking-wide">ThresholdStrategy</span>
            </div>
            <div className="space-y-3">
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-3">
                <p className="text-xs uppercase tracking-widest text-[#888] mb-1 font-bold">THRESHOLD</p>
                <p className="font-black text-xl text-white tabular">
                  {(Number(driftThresholdBps) / 100).toFixed(0)}%
                  <span className="text-xs text-[#888] ml-1 font-normal">{Number(driftThresholdBps)} bps</span>
                </p>
              </div>
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-3">
                <p className="text-xs uppercase tracking-widest text-[#888] mb-1 font-bold">MIN INTERVAL</p>
                <p className="font-black text-xl text-white tabular">{Number(minInterval)} <span className="text-xs text-[#888] font-normal">blocks</span></p>
              </div>
            </div>
            {activeStrategyAddr && (
              <div className="mt-4 pt-4 border-t border-[#1A1A1A]">
                <p className="text-xs uppercase tracking-widest text-[#888] mb-1 font-bold">CONTRACT</p>
                <AddressLink address={activeStrategyAddr} className="text-xs" />
              </div>
            )}
          </motion.div>

          {/* Share Price Card */}
          <motion.div custom={7} initial="hidden" animate="show" variants={cardVariants} className="card card-hover p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest text-[#888] mb-4">Share Price</h3>
              <p className="font-black text-4xl text-[#CAFF04] tabular leading-none mb-1">
                ${sp > 0 ? sp.toFixed(2) : '—'}
              </p>
              <p className="text-xs uppercase tracking-widest text-[#888] font-bold mt-2">PER SHARE</p>
            </div>
            {/* Mini sparkline placeholder */}
            <div className="mt-6 h-12 flex items-end gap-0.5">
              {[40, 55, 45, 60, 52, 70, 65, 80, 72, 88, 78, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background: i === 11 ? '#CAFF04' : `rgba(202,255,4,${0.15 + i * 0.05})`,
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-[#888] mt-1 font-mono">Price trend</p>
          </motion.div>
        </div>

        {/* ── Guard + Fee + Yield ──────────────────────── */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <motion.div custom={8} initial="hidden" animate="show" variants={cardVariants}>
            <GuardPanel />
          </motion.div>
          <motion.div custom={9} initial="hidden" animate="show" variants={cardVariants}>
            <FeePanel />
          </motion.div>
          <motion.div custom={10} initial="hidden" animate="show" variants={cardVariants}>
            <YieldPanel />
          </motion.div>
        </div>

        {/* ── Activity Feed (full width) ───────────────── */}
        <motion.div custom={11} initial="hidden" animate="show" variants={cardVariants} className="mb-6">
          <LiveActivityFeed />
        </motion.div>

        {/* ── Vault Config ─────────────────────────────── */}
        <motion.div custom={12} initial="hidden" animate="show" variants={cardVariants}>
          <VaultConfig />
        </motion.div>
      </div>
    </div>
  );
}
