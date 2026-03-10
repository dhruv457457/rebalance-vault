'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { stagenet } from '@/lib/wagmi';
import { motion } from 'framer-motion';

const navLinks = [
  { label: 'APP', href: '/app' },
  { label: 'ARCHITECTURE', href: '/architecture' },
  { label: 'GITHUB ↗', href: 'https://github.com/dhruv457457/rebalance-vault', external: true },
];

export function Header() {
  const pathname = usePathname();
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const wrongNetwork = isConnected && chain?.id !== stagenet.id;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1A1A1A] bg-[#0A0A0A]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="text-[#CAFF04] text-2xl group-hover:drop-shadow-[0_0_8px_rgba(202,255,4,0.8)] transition-all">◈</span>
            <span className="font-black text-white uppercase tracking-tight text-xl leading-none">DRIFT</span>
            <span className="text-[10px] font-bold bg-[#CAFF04] text-black px-1.5 py-0.5 rounded uppercase tracking-widest leading-none">
              STAGENET
            </span>
          </Link>

          {/* Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold uppercase tracking-widest text-[#888] hover:text-[#CAFF04] transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                    pathname === link.href ? 'text-[#CAFF04]' : 'text-[#888] hover:text-[#CAFF04]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Wallet */}
          <div className="flex items-center gap-3">
            {isConnected && wrongNetwork ? (
              <button
                onClick={() => switchChain({ chainId: stagenet.id })}
                className="px-4 py-2 rounded-xl bg-[#FF4444]/20 border border-[#FF4444]/40 text-[#FF4444] text-xs font-bold uppercase tracking-widest hover:bg-[#FF4444]/30 transition-all"
              >
                SWITCH NETWORK
              </button>
            ) : isConnected ? (
              <button
                onClick={() => disconnect()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111] border border-[#1A1A1A] text-[#888] hover:text-white hover:border-[#2A2A2A] text-xs font-mono transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-[#00FF88]" />
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => connect({ connector: injected() })}
                className="px-5 py-2.5 rounded-xl bg-[#CAFF04] text-black text-xs font-black uppercase tracking-widest hover:bg-[#d4ff33] transition-all"
              >
                CONNECT
              </motion.button>
            )}
          </div>
        </div>
      </nav>

      {/* Wrong network banner */}
      {wrongNetwork && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-[#FF4444]/10 border-b border-[#FF4444]/30 text-[#FF4444] text-xs font-bold uppercase tracking-widest text-center py-2.5 flex items-center justify-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4444] animate-pulse" />
          NOT ON STAGENET (CHAIN {stagenet.id})
          <button
            onClick={() => switchChain({ chainId: stagenet.id })}
            className="px-3 py-1 rounded-lg bg-[#FF4444] text-black text-xs font-black hover:bg-[#ff6666] transition-colors"
          >
            SWITCH
          </button>
        </div>
      )}
    </>
  );
}
