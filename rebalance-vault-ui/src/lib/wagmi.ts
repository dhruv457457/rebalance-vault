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
    default: {
      name: 'Stagenet Explorer',
      url: 'https://app.contract.dev/app/projects/6d87e5f7-548d-422c-b9c8-9c75d763e92e/explorer',
    },
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
