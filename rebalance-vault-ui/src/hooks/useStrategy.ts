'use client';

import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi';
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts';
import { useState } from 'react';

export function useStrategy() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const client = usePublicClient();
  const { address } = useAccount();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  async function getNonce() {
    if (!address || !client) return undefined;
    return client.getTransactionCount({ address, blockTag: 'latest' });
  }

  async function setActiveStrategy(strategyAddress: `0x${string}`) {
    const nonce = await getNonce();
    const hash = await writeContractAsync({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'setActiveStrategy',
      args: [strategyAddress],
      ...(nonce !== undefined && { nonce }),
    });
    setTxHash(hash);
    return hash;
  }

  return {
    setActiveStrategy,
    isPending: isPending || isConfirming,
    isSuccess,
    txHash,
  };
}
