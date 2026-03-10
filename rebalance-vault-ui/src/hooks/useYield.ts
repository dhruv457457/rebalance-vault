'use client';

import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts';
import { useState } from 'react';

export function useYieldActions() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const client = usePublicClient();
  const { address } = useAccount();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  async function getNonce() {
    if (!address || !client) return undefined;
    return client.getTransactionCount({ address, blockTag: 'latest' });
  }

  async function depositToYield(usdcAmount: string) {
    const nonce = await getNonce();
    const hash = await writeContractAsync({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'depositToYield',
      args: [parseUnits(usdcAmount, 6)],
      ...(nonce !== undefined && { nonce }),
    });
    setTxHash(hash);
    return hash;
  }

  async function withdrawFromYield(usdcAmount: string) {
    const nonce = await getNonce();
    const hash = await writeContractAsync({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'withdrawFromYield',
      args: [parseUnits(usdcAmount, 6)],
      ...(nonce !== undefined && { nonce }),
    });
    setTxHash(hash);
    return hash;
  }

  async function harvestYield() {
    const nonce = await getNonce();
    const hash = await writeContractAsync({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'harvestYield',
      ...(nonce !== undefined && { nonce }),
    });
    setTxHash(hash);
    return hash;
  }

  async function toggleYield(enabled: boolean) {
    const nonce = await getNonce();
    const hash = await writeContractAsync({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'setYieldEnabled',
      args: [enabled],
      ...(nonce !== undefined && { nonce }),
    });
    setTxHash(hash);
    return hash;
  }

  return {
    depositToYield,
    withdrawFromYield,
    harvestYield,
    toggleYield,
    isPending: isPending || isConfirming,
    isSuccess,
    txHash,
  };
}
