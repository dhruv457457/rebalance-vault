'use client';

import { useReadContract, useReadContracts } from 'wagmi';
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contracts';

const CONTRACT = { address: VAULT_ADDRESS, abi: VAULT_ABI } as const;
const REFETCH_INTERVAL = 10_000;

export function useVaultData() {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      { ...CONTRACT, functionName: 'getPortfolioSummary' },
      { ...CONTRACT, functionName: 'getSharePrice' },
      { ...CONTRACT, functionName: 'getRebalanceStats' },
      { ...CONTRACT, functionName: 'getVaultConfig' },
      { ...CONTRACT, functionName: 'getFeeInfo' },
      { ...CONTRACT, functionName: 'getGuardStatus' },
      { ...CONTRACT, functionName: 'getYieldInfo' },
      { ...CONTRACT, functionName: 'getEthPrice' },
    ],
    query: { refetchInterval: REFETCH_INTERVAL },
  });

  const [summary, sharePrice, rebalanceStats, vaultConfig, feeInfo, guardStatus, yieldInfo, ethPrice] = data ?? [];

  return {
    summary: summary?.result,
    sharePrice: sharePrice?.result,
    rebalanceStats: rebalanceStats?.result,
    vaultConfig: vaultConfig?.result,
    feeInfo: feeInfo?.result,
    guardStatus: guardStatus?.result,
    yieldInfo: yieldInfo?.result,
    ethPrice: ethPrice?.result,
    isLoading,
    error,
    refetch,
  };
}

export function usePortfolioSummary() {
  return useReadContract({
    ...CONTRACT,
    functionName: 'getPortfolioSummary',
    query: { refetchInterval: REFETCH_INTERVAL },
  });
}

export function useSharePrice() {
  return useReadContract({
    ...CONTRACT,
    functionName: 'getSharePrice',
    query: { refetchInterval: REFETCH_INTERVAL },
  });
}

export function useGuardStatus() {
  return useReadContract({
    ...CONTRACT,
    functionName: 'getGuardStatus',
    query: { refetchInterval: REFETCH_INTERVAL },
  });
}

export function useYieldInfo() {
  return useReadContract({
    ...CONTRACT,
    functionName: 'getYieldInfo',
    query: { refetchInterval: REFETCH_INTERVAL },
  });
}

export function useFeeInfo() {
  return useReadContract({
    ...CONTRACT,
    functionName: 'getFeeInfo',
    query: { refetchInterval: REFETCH_INTERVAL },
  });
}

export function useVaultConfig() {
  return useReadContract({
    ...CONTRACT,
    functionName: 'getVaultConfig',
    query: { refetchInterval: REFETCH_INTERVAL },
  });
}

export function useRebalanceStatsData() {
  return useReadContract({
    ...CONTRACT,
    functionName: 'getRebalanceStats',
    query: { refetchInterval: REFETCH_INTERVAL },
  });
}
