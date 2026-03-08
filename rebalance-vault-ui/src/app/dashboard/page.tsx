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
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { stagenet } from '@/lib/wagmi';
import { formatUnits } from 'viem';

export default function DashboardPage() {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { switchChain } = useSwitchChain();

  const { summary, sharePrice, isLoading } = useVaultData();
  const { shares, ethValue, usdcValue } = useUserPosition();

  const wrongNetwork = isConnected && chain?.id !== stagenet.id;

  if (!isConnected) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center grid-bg">
        <div className="text-center">
          <div className="text-6xl mb-4">◈</div>
          <h2 className="font-heading text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-[#94A3B8] mb-6">Connect to access the RebalanceVault dashboard</p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => connect({ connector: injected() })}
            className="px-8 py-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold uppercase tracking-wider"
          >
            Connect Wallet
          </motion.button>
        </div>
      </div>
    );
  }

  const eth = summary?.[0] ?? 0n;
  const usdc = summary?.[1] ?? 0n;
  const total = summary?.[2] ?? 0n;
  const drift = summary?.[3] ?? 0n;
  const driftThreshold = summary?.[4] ? summary[4] / 10n : 100n; // targetBps → use 100 as drift threshold default
  const paused = summary?.[7] ?? false;
  const tvl = Number(formatUnits(total, 6));
  const sp = sharePrice ? Number(formatUnits(sharePrice, 18)) : 1.0;
  const userShares = shares ? Number(formatUnits(shares, 18)) : 0;
  const userEth = ethValue ? Number(formatUnits(ethValue, 18)) : 0;
  const userUsdc = usdcValue ? Number(formatUnits(usdcValue, 6)) : 0;
  const totalShares = summary?.[6] ?? 1n;
  const userSharePct = totalShares > 0n && shares ? (Number(shares) / Number(totalShares)) * 100 : 0;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0A0A0F] grid-bg">
      {wrongNetwork && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-yellow-500 text-black text-sm font-semibold text-center py-2 flex items-center justify-center gap-3">
          ⚠ Switch to Stagenet (Chain {stagenet.id}) to interact
          <button onClick={() => switchChain({ chainId: stagenet.id })} className="px-3 py-0.5 rounded bg-black text-yellow-400 text-xs font-bold">
            Switch Network
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-[#94A3B8] text-sm mt-1">
              {address?.slice(0, 6)}...{address?.slice(-4)} · Stagenet
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={paused ? 'paused' : 'online'} label={paused ? 'Paused' : 'Live'} />
            {isLoading && <span className="text-xs text-[#94A3B8]">Syncing...</span>}
          </div>
        </div>

        {/* Rebalance stats strip */}
        <section className="mb-6">
          <RebalanceStats />
        </section>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Portfolio panel */}
          <div className="lg:col-span-2 bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-white">Portfolio</h2>
              <span className="font-mono text-3xl font-bold text-white tabular">
                ${tvl.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <PortfolioPieChart ethValueUsd={eth} usdcValueUsd={usdc} totalUsd={total} size="sm" />
              <div className="flex flex-col justify-center space-y-4">
                <div className="bg-[#13131A] rounded-lg p-4">
                  <p className="text-[#94A3B8] text-xs mb-1">ETH Value</p>
                  <p className="font-mono text-cyan-400 text-xl font-bold">
                    $<AnimatedNumber value={Number(formatUnits(eth, 6))} decimals={2} />
                  </p>
                </div>
                <div className="bg-[#13131A] rounded-lg p-4">
                  <p className="text-[#94A3B8] text-xs mb-1">USDC Value</p>
                  <p className="font-mono text-violet-400 text-xl font-bold">
                    $<AnimatedNumber value={Number(formatUnits(usdc, 6))} decimals={2} />
                  </p>
                </div>
                <div className="bg-[#13131A] rounded-lg p-4">
                  <p className="text-[#94A3B8] text-xs mb-1">Share Price</p>
                  <p className="font-mono text-white text-xl font-bold">
                    $<AnimatedNumber value={sp} decimals={6} />
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <DriftIndicator driftBps={drift} thresholdBps={100n} />
            </div>
          </div>

          {/* User position + deposit/withdraw */}
          <div className="space-y-4">
            <div className="bg-[#1C1C28] border border-[#2D2D3D] rounded-xl p-5">
              <h2 className="font-heading text-lg font-bold text-white mb-4">Your Position</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-[#2D2D3D]">
                  <span className="text-[#94A3B8] text-sm">Shares</span>
                  <span className="font-mono text-white text-sm">{userShares.toFixed(4)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#2D2D3D]">
                  <span className="text-[#94A3B8] text-sm">ETH Value</span>
                  <span className="font-mono text-cyan-400 text-sm">${userEth.toFixed(4)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#2D2D3D]">
                  <span className="text-[#94A3B8] text-sm">USDC Value</span>
                  <span className="font-mono text-violet-400 text-sm">${userUsdc.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#94A3B8] text-sm">Pool Share</span>
                  <span className="font-mono text-lime-400 text-sm">{userSharePct.toFixed(4)}%</span>
                </div>
              </div>
            </div>

            <DepositForm />
            <WithdrawForm />
          </div>
        </div>

        {/* Bottom grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <LiveActivityFeed />
          </div>
          <GuardPanel />
        </div>

        {/* Bottom strip */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <YieldPanel />
          <FeePanel />
        </div>

        <VaultConfig />
      </div>
    </div>
  );
}
