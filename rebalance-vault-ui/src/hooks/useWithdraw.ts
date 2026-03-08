'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi';
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts';

async function getLatestNonce(
  client: ReturnType<typeof usePublicClient>,
  address: `0x${string}`
): Promise<number> {
  if (!client) throw new Error('No public client');
  return client.getTransactionCount({ address, blockTag: 'latest' });
}

export function useWithdraw() {
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const client = usePublicClient();
  const { address } = useAccount();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  async function withdraw(shareAmount: bigint) {
    const nonce = address ? await getLatestNonce(client, address) : undefined;
    const hash = await writeContractAsync({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'withdraw',
      args: [shareAmount],
      ...(nonce !== undefined && { nonce }),
    });
    setTxHash(hash);
    return hash;
  }

  async function emergencyWithdraw() {
    const nonce = address ? await getLatestNonce(client, address) : undefined;
    const hash = await writeContractAsync({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'emergencyWithdraw',
      ...(nonce !== undefined && { nonce }),
    });
    setTxHash(hash);
    return hash;
  }

  return {
    withdraw,
    emergencyWithdraw,
    txHash,
    isPending: isWritePending || isConfirming,
    isSuccess,
  };
}
