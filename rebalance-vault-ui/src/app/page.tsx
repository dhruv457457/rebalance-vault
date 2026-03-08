'use client';

import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { usePortfolioSummary, useSharePrice } from '@/hooks/useVaultData';
import { PortfolioPieChart } from '@/components/vault/PortfolioPieChart';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { formatUnits } from 'viem';
import { stagenet } from '@/lib/wagmi';
import Link from 'next/link';

const words = ['Your', 'portfolio.', 'Rebalanced.', 'Automatically.'];

export default function LandingPage() {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: summary } = usePortfolioSummary();
  const { data: sharePrice } = useSharePrice();

  const wrongNetwork = isConnected && chain?.id !== stagenet.id;
  const eth = summary?.[0] ?? 0n;
  const usdc = summary?.[1] ?? 0n;
  const total = summary?.[2] ?? 0n;
  const rebalanceCount = summary?.[5] ?? 0n;
  const sp = sharePrice ? Number(formatUnits(sharePrice, 18)) : 1.0;
  const tvl = Number(formatUnits(total, 6));

  return (
    <div className="relative min-h-[calc(100vh-56px)] grid-bg overflow-hidden">
      {/* Noise overlay */}
      <div className="absolute inset-0 noise-bg pointer-events-none" />

      {/* Wrong network banner */}
      {wrongNetwork && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-yellow-500 text-black text-sm font-semibold text-center py-2 flex items-center justify-center gap-3">
          ⚠ You are not on Stagenet (Chain {stagenet.id})
          <button
            onClick={() => switchChain({ chainId: stagenet.id })}
            className="px-3 py-0.5 rounded bg-black text-yellow-400 text-xs font-bold hover:bg-gray-900"
          >
            Switch Network
          </button>
        </div>
      )}

      {/* Purple ambient glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at 70% 30%, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at 30% 80%, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-56px)] flex items-center">
        <div className="grid lg:grid-cols-2 gap-16 w-full py-16">
          {/* Left: tagline + CTA */}
          <div className="flex flex-col justify-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600/20 border border-violet-600/30 text-violet-300 text-xs font-semibold mb-8 w-fit"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              EIP-2535 Diamond · Chainlink · Uniswap V3 · Aave
            </motion.div>

            {/* Animated headline */}
            <h1 className="font-heading text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {words.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.18, duration: 0.5 }}
                  className={`inline-block mr-3 ${word === 'Rebalanced.' ? 'text-violet-400' : word === 'Automatically.' ? 'text-cyan-400' : 'text-white'}`}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-[#94A3B8] text-lg mb-10 leading-relaxed max-w-lg"
            >
              An autonomous on-chain vault that maintains a 50/50 ETH/USDC allocation
              using Chainlink price feeds, Uniswap V3 swaps, and Aave yield strategies.
            </motion.p>

            {/* Stats pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <StatPill label="TVL" value={`$${tvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} accent="violet" />
              <StatPill label="Share Price" value={`$${sp.toFixed(6)}`} accent="cyan" />
              <StatPill label="Rebalances" value={Number(rebalanceCount).toString()} accent="lime" />
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex flex-wrap gap-3"
            >
              {!isConnected ? (
                <motion.button
                  onClick={() => connect({ connector: injected() })}
                  whileTap={{ scale: 0.96 }}
                  className="px-8 py-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-base uppercase tracking-wider shadow-lg shadow-violet-900/40 active:translate-y-0.5"
                >
                  Connect Wallet
                </motion.button>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/dashboard">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      className="px-8 py-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-base uppercase tracking-wider"
                    >
                      Open Dashboard →
                    </motion.button>
                  </Link>
                  <button
                    onClick={() => disconnect()}
                    className="px-4 py-4 rounded-lg border border-[#2D2D3D] text-[#94A3B8] hover:text-white text-sm"
                  >
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </button>
                </div>
              )}
              <Link href="/about">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  className="px-8 py-4 rounded-lg border border-[#2D2D3D] hover:border-violet-500/50 text-[#94A3B8] hover:text-white font-semibold text-base"
                >
                  Learn More
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {/* Right: live pie chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-2xl p-8 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#94A3B8] text-sm font-medium">Live Portfolio Allocation</p>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>

              <PortfolioPieChart
                ethValueUsd={eth}
                usdcValueUsd={usdc}
                totalUsd={total}
                size="lg"
              />

              <div className="mt-6 pt-6 border-t border-[#2D2D3D]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Total Value Locked</span>
                  <span className="font-mono text-white font-bold">
                    ${tvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ delay: 2, duration: 2, repeat: Infinity, repeatType: 'loop' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#94A3B8] text-xs flex flex-col items-center gap-1"
      >
        <span>Scroll</span>
        <span>↓</span>
      </motion.div>
    </div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colors: Record<string, string> = {
    violet: 'bg-violet-600/20 border-violet-600/30 text-violet-300',
    cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
    lime: 'bg-lime-400/20 border-lime-400/30 text-lime-300',
  };
  return (
    <div className={`px-4 py-2 rounded-full border text-xs font-mono font-semibold ${colors[accent]}`}>
      <span className="opacity-70">{label}: </span>{value}
    </div>
  );
}
