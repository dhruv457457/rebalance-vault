'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts';

/**
 * Fetches the confirmed (latest) nonce for an address.
 * Uses 'latest' block tag — compatible with private/custom RPCs that
 * don't support the 'pending' tag (which is viem's default).
 */
async function getLatestNonce(
  client: ReturnType<typeof usePublicClient>,
  address: `0x${string}`
): Promise<number> {
  if (!client) throw new Error('No public client');
  return client.getTransactionCount({ address, blockTag: 'latest' });
}

export function useDeposit() {
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const client = usePublicClient();
  const { address } = useAccount();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  async function depositEth(ethAmount: string) {
    const nonce = address ? await getLatestNonce(client, address) : undefined;
    const hash = await writeContractAsync({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'deposit',
      value: parseEther(ethAmount),
      ...(nonce !== undefined && { nonce }),
    });
    setTxHash(hash);
    return hash;
  }

  async function depositUsdc(usdcAmount: string) {
    const nonce = address ? await getLatestNonce(client, address) : undefined;
    const hash = await writeContractAsync({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'depositUSDC',
      args: [parseUnits(usdcAmount, 6)],
      ...(nonce !== undefined && { nonce }),
    });
    setTxHash(hash);
    return hash;
  }

  return {
    depositEth,
    depositUsdc,
    txHash,
    isPending: isWritePending || isConfirming,
    isSuccess,
  };
}
