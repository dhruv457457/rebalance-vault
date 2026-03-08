'use client';

import { formatAddress } from '@/lib/formatters';
import { stagenet } from '@/lib/wagmi';

interface AddressLinkProps {
  address: string;
  className?: string;
  showFull?: boolean;
}

export function AddressLink({ address, className = '', showFull = false }: AddressLinkProps) {
  const explorerUrl = `${stagenet.blockExplorers.default.url}/address/${address}`;
  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`font-mono text-cyan-400 hover:text-cyan-300 hover:underline transition-colors ${className}`}
    >
      {showFull ? address : formatAddress(address)}
    </a>
  );
}
