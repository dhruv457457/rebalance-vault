'use client';

import { motion } from 'framer-motion';
import { AddressLink } from '@/components/ui/AddressLink';

const DIAMOND_ADDRESS = '0x26F9Ec14564B73DC95a79898bce62656a9A5503D';

const facets = [
  { name: 'VaultFacet', fns: 8, key: ['deposit()', 'withdraw()', 'emergencyWithdraw()'], color: '#CAFF04', textColor: 'text-black' },
  { name: 'RebalanceFacet', fns: 4, key: ['performUpkeep()', 'checkUpkeep()', 'rebalance()'], color: '#7B61FF', textColor: 'text-white' },
  { name: 'StrategyFacet', fns: 5, key: ['setActiveStrategy()', 'getActiveStrategy()', 'evaluateDrift()'], color: '#7B61FF', textColor: 'text-white' },
  { name: 'OracleFacet', fns: 3, key: ['getEthPrice()', 'getCurrentDrift()', 'getLatestAnswer()'], color: '#00F0FF', textColor: 'text-black' },
  { name: 'FeeFacet', fns: 4, key: ['getFeeInfo()', 'collectFees()', 'setFeeRecipient()'], color: '#1A1A1A', textColor: 'text-white', border: '#CAFF04' },
  { name: 'GuardFacet', fns: 6, key: ['getGuardStatus()', 'checkCircuitBreaker()', 'resetRateLimit()'], color: '#FF4444', textColor: 'text-white' },
  { name: 'YieldFacet', fns: 4, key: ['getYieldInfo()', 'depositToAave()', 'withdrawFromAave()'], color: '#00FF88', textColor: 'text-black' },
  { name: 'AdminFacet', fns: 7, key: ['setVaultConfig()', 'pause()', 'unpause()', 'transferOwnership()'], color: '#1A1A1A', textColor: 'text-white', border: '#7B61FF' },
  { name: 'ViewFacet', fns: 12, key: ['getPortfolioSummary()', 'getVaultConfig()', 'getSharePrice()'], color: '#1A1A1A', textColor: 'text-white', border: '#00F0FF' },
];

// Positions: [col, row] in a 4-col grid around a center column
const facetLayout = [
  { name: 'VaultFacet', pos: 'top-left' },
  { name: 'RebalanceFacet', pos: 'top-center-left' },
  { name: 'StrategyFacet', pos: 'top-center-right' },
  { name: 'OracleFacet', pos: 'top-right' },
  { name: 'FeeFacet', pos: 'bottom-left' },
  { name: 'GuardFacet', pos: 'bottom-center-left' },
  { name: 'YieldFacet', pos: 'bottom-center-right' },
  { name: 'AdminFacet', pos: 'bottom-right' },
  { name: 'ViewFacet', pos: 'middle-right' },
];

const contracts = [
  { name: 'Diamond (Proxy)', address: '0x26F9Ec14564B73DC95a79898bce62656a9A5503D', type: 'Core' },
  { name: 'DiamondCutFacet', address: '0x6815fAd96859f0B9009445c5e97b1A727e4758fd', type: 'Admin' },
  { name: 'DiamondLoupeFacet', address: '0xc17859FB5136bc989ce886442Cf9cDF9b09F9eaF', type: 'Introspection' },
  { name: 'VaultFacet', address: '0xf11c3c8858081A06f1E0A7c2096D8C63e40aa02d', type: 'Vault' },
  { name: 'RebalanceFacet', address: '0x98e27145bAd9B2728FEc1B0793C4cA95EC4529AE', type: 'Rebalance' },
  { name: 'StrategyFacet', address: '0x21E3Fa24606eC593b2BE3F989325C2d39089c754', type: 'Strategy' },
  { name: 'OracleFacet', address: '0x88C24C699C30E6104d7e5656b66e668B19CDa08f', type: 'Oracle' },
  { name: 'GuardFacet', address: '0xE32f09d4E6C3d023733685deAe8Ea76cD05548eb', type: 'Guard' },
  { name: 'FeeFacet', address: '0x67ce346dFA4Ccd0575a606F08d474f97a9e431fF', type: 'Fee' },
  { name: 'YieldFacet', address: '0x210e428e1Cf14E97eeD01dEd877598fCBF5fCfe1', type: 'Yield' },
  { name: 'AdminFacet', address: '0x19455F8F5ce5e24ab326a44Af084E77A5f7AAB0A', type: 'Admin' },
  { name: 'ThresholdStrategy', address: '0x910074FdFCDC0d3d96150C4F3c7291d558A4205e', type: 'Strategy' },
  { name: 'UniswapV3Adapter', address: '0x4D7dd90f8676f90B932296F2b3DaE47e7cdD5Cc3', type: 'Swap' },
  { name: 'Chainlink ETH/USD', address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', type: 'Oracle' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.06 } as const }),
};

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <p className="text-xs font-black uppercase tracking-widest text-[#CAFF04] mb-3">EIP-2535</p>
          <h1 className="font-black text-5xl uppercase tracking-tighter text-white mb-4">
            DIAMOND ARCHITECTURE
          </h1>
          <p className="text-[#888] text-base max-w-2xl leading-relaxed">
            DRIFT uses the Diamond Proxy pattern — one address, many facets, infinite upgradeability.
            9 specialized facets handle every protocol function.
          </p>
        </motion.div>

        {/* ── Diamond Diagram ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card p-8 mb-8 relative overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(202,255,4,0.04) 0%, transparent 60%)' }}
          />

          <h2 className="font-black text-xl uppercase tracking-tighter text-white mb-8 text-center">
            SYSTEM DIAGRAM
          </h2>

          {/* Top row: 4 facets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {facets.slice(0, 4).map((facet, i) => (
              <FacetCard key={facet.name} facet={facet} index={i} />
            ))}
          </div>

          {/* Center: Diamond + ViewFacet */}
          <div className="flex items-center justify-center gap-6 mb-6 relative">
            {/* Left connector line */}
            <div className="hidden md:block flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(202,255,4,0.3))' }} />

            {/* Central Diamond */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex-shrink-0 w-36 h-36 flex flex-col items-center justify-center rounded-2xl relative"
              style={{
                background: 'linear-gradient(135deg, #CAFF04 0%, #a8d400 100%)',
                boxShadow: '0 0 40px rgba(202,255,4,0.4), 0 0 80px rgba(202,255,4,0.15)',
              }}
            >
              <span className="text-4xl font-black text-black leading-none">◈</span>
              <span className="text-black font-black text-xs uppercase tracking-widest mt-1">DIAMOND</span>
              <span className="text-black/60 font-bold text-[10px] uppercase tracking-wider">PROXY</span>
            </motion.div>

            {/* ViewFacet on right of center */}
            <div className="hidden md:flex flex-1 items-center gap-4">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,240,255,0.3), transparent)' }} />
              <FacetCard facet={facets[8]} index={8} compact />
            </div>

            {/* Mobile ViewFacet */}
            <div className="flex md:hidden">
              <FacetCard facet={facets[8]} index={8} compact />
            </div>
          </div>

          {/* Bottom row: 4 facets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {facets.slice(4, 8).map((facet, i) => (
              <FacetCard key={facet.name} facet={facet} index={i + 4} />
            ))}
          </div>

          {/* External connections */}
          <div className="mt-8 pt-6 border-t border-[#1A1A1A]">
            <p className="text-xs font-black uppercase tracking-widest text-[#888] mb-4 text-center">
              EXTERNAL INTEGRATIONS
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ExternalCard
                icon="⛓"
                name="CHAINLINK"
                desc="ETH/USD Price Feed + Automation"
                color="#7B61FF"
                details={['checkUpkeep()', 'performUpkeep()', 'AggregatorV3Interface']}
              />
              <ExternalCard
                icon="🦄"
                name="UNISWAP V3"
                desc="ETH ↔ USDC Swaps (0.3% pool)"
                color="#FF007A"
                details={['exactInputSingle()', 'ISwapRouter', 'POOL_FEE: 3000']}
              />
              <ExternalCard
                icon="👻"
                name="AAVE V3"
                desc="USDC Yield Strategy"
                color="#B6509E"
                details={['supply()', 'withdraw()', 'IPool interface']}
              />
            </div>
          </div>
        </motion.div>

        {/* ── Facets Detail Grid ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="font-black text-2xl uppercase tracking-tighter text-white mb-6">FACET DETAILS</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facets.map((facet, i) => (
              <motion.div
                key={facet.name}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="card card-hover p-5"
                style={{ borderColor: facet.border || '#1A1A1A' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: facet.color === '#1A1A1A' ? (facet.border || '#888') : facet.color }}
                  />
                  <span className="text-xs font-bold text-[#888] uppercase tracking-widest">
                    {facet.fns} functions
                  </span>
                </div>
                <h3 className="font-black text-base text-white uppercase tracking-tight mb-3">
                  {facet.name}
                </h3>
                <div className="space-y-1">
                  {facet.key.map((fn) => (
                    <p key={fn} className="font-mono text-xs text-[#888] bg-[#0A0A0A] border border-[#1A1A1A] px-2.5 py-1 rounded-lg">
                      {fn}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Contract Addresses ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6 mb-8"
        >
          <h2 className="font-black text-xl uppercase tracking-tighter text-white mb-6">CONTRACT ADDRESSES</h2>
          <div className="space-y-3">
            {contracts.map((c, i) => (
              <motion.div
                key={c.name}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex items-center justify-between py-3 border-b border-[#1A1A1A] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-widest bg-[#1A1A1A] text-[#888] px-2 py-0.5 rounded">
                    {c.type}
                  </span>
                  <span className="text-sm font-bold text-white">{c.name}</span>
                </div>
                {c.address.length > 6 && !c.address.includes('...') ? (
                  <div className="flex items-center gap-3">
                    <AddressLink address={c.address} className="text-xs" />
                    <a
                      href={`https://app.contract.dev/app/projects/6d87e5f7-548d-422c-b9c8-9c75d763e92e/explorer/address/${c.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#888] hover:text-[#CAFF04] uppercase tracking-widest transition-colors"
                    >
                      VIEW ↗
                    </a>
                  </div>
                ) : (
                  <span className="text-xs font-mono text-[#555]">—</span>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[#1A1A1A] flex flex-wrap gap-4">
            <a
              href={`https://app.contract.dev/app/projects/6d87e5f7-548d-422c-b9c8-9c75d763e92e/explorer/address/${DIAMOND_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#CAFF04] text-black text-xs font-black uppercase tracking-widest hover:bg-[#d4ff33] transition-all"
            >
              VIEW DIAMOND ON EXPLORER ↗
            </a>
            <a
              href="https://github.com/dhruv457457/rebalance-vault"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#CAFF04] text-[#CAFF04] text-xs font-black uppercase tracking-widest hover:bg-[#CAFF04]/10 transition-all"
            >
              VIEW ON GITHUB ↗
            </a>
          </div>
        </motion.div>

        {/* ── Tech Stack ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { name: 'EIP-2535', desc: 'Diamond Proxy', color: '#CAFF04' },
            { name: 'Chainlink', desc: 'Price Feeds + Automation', color: '#7B61FF' },
            { name: 'Uniswap V3', desc: 'Swap Infrastructure', color: '#FF007A' },
            { name: 'Aave V3', desc: 'Yield Generation', color: '#B6509E' },
          ].map((tech, i) => (
            <motion.div
              key={tech.name}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="card card-hover p-5 text-center"
            >
              <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: `${tech.color}15`, border: `1px solid ${tech.color}30` }}
              >
                <div className="w-4 h-4 rounded-full" style={{ background: tech.color }} />
              </div>
              <p className="font-black text-sm text-white uppercase tracking-tight">{tech.name}</p>
              <p className="text-xs text-[#888] mt-1">{tech.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function FacetCard({ facet, index, compact = false }: { facet: typeof facets[0]; index: number; compact?: boolean }) {
  const bg = facet.color === '#1A1A1A' ? '#111111' : facet.color;
  const border = facet.border ? `1px solid ${facet.border}40` : 'none';

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className={`rounded-xl p-3 ${compact ? 'w-36' : ''}`}
      style={{ background: bg, border }}
    >
      <p className={`font-black text-xs uppercase tracking-tight leading-none mb-1.5 ${facet.textColor}`}>
        {facet.name}
      </p>
      <p className={`text-[10px] ${facet.textColor === 'text-black' ? 'text-black/60' : 'text-white/50'} font-bold`}>
        {facet.fns} functions
      </p>
    </motion.div>
  );
}

function ExternalCard({ icon, name, desc, color, details }: {
  icon: string; name: string; desc: string; color: string; details: string[];
}) {
  return (
    <div className="bg-[#0A0A0A] border rounded-xl p-4" style={{ borderColor: `${color}30` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="font-black text-sm uppercase tracking-tight" style={{ color }}>{name}</span>
      </div>
      <p className="text-xs text-[#888] mb-3">{desc}</p>
      <div className="space-y-1">
        {details.map((d) => (
          <p key={d} className="font-mono text-[10px] text-[#888] bg-[#111] border border-[#1A1A1A] px-2 py-0.5 rounded">
            {d}
          </p>
        ))}
      </div>
    </div>
  );
}
