'use client';

import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected, metaMask } from 'wagmi/connectors';

export const stagenet = defineChain({
  id: 56025,
  name: 'Stagenet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.contract.dev/988676b94cce2d8cbb1e2c648e864c2b'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.contract.dev' },
  },
});

export const wagmiConfig = createConfig({
  chains: [stagenet],
  connectors: [injected(), metaMask()],
  transports: {
    [stagenet.id]: http('https://rpc.contract.dev/988676b94cce2d8cbb1e2c648e864c2b'),
  },
  ssr: true,
});
