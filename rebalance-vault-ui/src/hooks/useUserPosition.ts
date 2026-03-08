'use client';

import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts';

export function useUserPosition() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'getUserPosition',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10_000,
    },
  });

  return {
    shares: data?.[0],
    ethValue: data?.[1],
    usdcValue: data?.[2],
    isLoading,
    error,
    refetch,
    address,
  };
}
