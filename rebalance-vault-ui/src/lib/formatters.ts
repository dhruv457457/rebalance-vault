import { formatUnits } from 'viem';

export function formatUsd(value: bigint | number, decimals = 6): string {
  const num = typeof value === 'bigint' ? Number(formatUnits(value, decimals)) : value / 10 ** decimals;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

export function formatUsdRaw(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function formatEth(value: bigint, decimals = 18): string {
  return Number(formatUnits(value, decimals)).toFixed(6) + ' ETH';
}

export function formatShares(value: bigint): string {
  return Number(formatUnits(value, 18)).toFixed(4);
}

export function formatSharePrice(value: bigint): string {
  return '$' + Number(formatUnits(value, 18)).toFixed(6);
}

export function formatBps(bps: bigint | number): string {
  const num = typeof bps === 'bigint' ? Number(bps) : bps;
  return (num / 100).toFixed(2) + '%';
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBlock(block: bigint): string {
  return '#' + block.toLocaleString();
}

export function formatGas(gas: bigint): string {
  return Number(gas).toLocaleString() + ' gas';
}

export function bpsToPercent(bps: bigint | number): number {
  const num = typeof bps === 'bigint' ? Number(bps) : bps;
  return num / 100;
}

export function weiToEthNumber(wei: bigint): number {
  return Number(formatUnits(wei, 18));
}

export function usdcToNumber(usdc: bigint): number {
  return Number(formatUnits(usdc, 6));
}

export function weiUsdToNumber(weiUsd: bigint): number {
  // Portfolio values are stored in USD with 6 decimal places (USDC-like)
  return Number(formatUnits(weiUsd, 6));
}
