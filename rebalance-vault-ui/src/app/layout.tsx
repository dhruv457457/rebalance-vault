import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RebalanceVault — Autonomous DeFi Portfolio Rebalancer',
  description: 'Autonomous on-chain ETH/USDC portfolio rebalancer built on the EIP-2535 Diamond proxy pattern with Chainlink oracles, Uniswap V3, and Aave yield.',
  openGraph: {
    title: 'RebalanceVault',
    description: 'Your portfolio. Rebalanced. Automatically.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0A0A0F] text-white font-sans antialiased">
        <Providers>
          {/* Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#2D2D3D] bg-[#0A0A0F]/90 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
              <a href="/" className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="text-violet-500">◈</span> RebalanceVault
              </a>
              <div className="flex items-center gap-6">
                <a href="/dashboard" className="text-sm text-[#94A3B8] hover:text-white transition-colors">Dashboard</a>
                <a href="/analytics" className="text-sm text-[#94A3B8] hover:text-white transition-colors">Analytics</a>
                <a href="/about" className="text-sm text-[#94A3B8] hover:text-white transition-colors">About</a>
              </div>
            </div>
          </nav>
          <main className="pt-14">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
