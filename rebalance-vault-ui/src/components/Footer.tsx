'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#1A1A1A] bg-[#0A0A0A] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#CAFF04] text-xl">◈</span>
              <span className="font-black text-white uppercase tracking-tight text-lg">DRIFT</span>
              <span className="text-xs font-bold bg-[#CAFF04] text-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                STAGENET
              </span>
            </div>
            <p className="text-[#888] text-xs leading-relaxed max-w-sm">
              Autonomous Portfolio Drift Detection &amp; Correction. Built on EIP-2535 Diamond Proxy.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/" className="text-[#888] hover:text-[#CAFF04] transition-colors">Home</Link>
            <Link href="/app" className="text-[#888] hover:text-[#CAFF04] transition-colors">App</Link>
            <Link href="/architecture" className="text-[#888] hover:text-[#CAFF04] transition-colors">Architecture</Link>
            <a
              href="https://github.com/dhruv457457/rebalance-vault"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#888] hover:text-[#CAFF04] transition-colors"
            >
              GitHub ↗
            </a>
            <a
              href="https://explorer.contract.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#888] hover:text-[#CAFF04] transition-colors"
            >
              Explorer ↗
            </a>
          </div>
        </div>

        <div className="gradient-line my-6" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#555]">
          <p>Built for <span className="text-[#CAFF04]">contract.dev</span> Stagenet Hackathon 2026</p>
          <p>Powered by Chainlink · Uniswap V3 · EIP-2535 Diamond Proxy</p>
        </div>
      </div>
    </footer>
  );
}
