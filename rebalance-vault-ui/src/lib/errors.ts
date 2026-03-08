/**
 * Parses raw viem/wagmi errors into clean, user-readable messages.
 */
export function parseContractError(err: unknown): { message: string; hint?: string } {
  const raw = err instanceof Error ? err.message : String(err);

  // ── Nonce already mined ──────────────────────────────────────────────
  if (raw.includes('Nonce') && raw.includes('already mined')) {
    const nonceMatch = raw.match(/Nonce (\d+) already mined/);
    const nonce = nonceMatch ? nonceMatch[1] : 'unknown';
    return {
      message: `Transaction nonce ${nonce} was already mined.`,
      hint: 'Your wallet nonce is out of sync. In MetaMask: Settings → Advanced → Clear activity tab data, then try again.',
    };
  }

  // ── User rejected / cancelled ────────────────────────────────────────
  if (
    raw.includes('User rejected') ||
    raw.includes('user rejected') ||
    raw.includes('4001') ||
    raw.includes('ACTION_REJECTED')
  ) {
    return { message: 'Transaction rejected in wallet.' };
  }

  // ── Nonce too low ────────────────────────────────────────────────────
  if (raw.includes('nonce too low') || raw.includes('replacement transaction underpriced')) {
    return {
      message: 'Transaction nonce too low.',
      hint: 'Reset your wallet account: MetaMask → Settings → Advanced → Clear activity tab data.',
    };
  }

  // ── Insufficient funds ───────────────────────────────────────────────
  if (raw.includes('insufficient funds') || raw.includes('InsufficientFundsError')) {
    return { message: 'Insufficient funds to cover this transaction + gas.' };
  }

  // ── Contract revert with reason ──────────────────────────────────────
  if (raw.includes('reason:')) {
    const reason = raw.split('reason:')[1].split('\n')[0].trim();
    return { message: `Contract reverted: ${reason}` };
  }

  if (raw.includes('reverted') || raw.includes('execution reverted')) {
    return { message: 'Contract reverted without a reason string.' };
  }

  // ── Already known / duplicate ────────────────────────────────────────
  if (raw.includes('already known') || raw.includes('AlreadyKnownError')) {
    return {
      message: 'This transaction is already pending in the mempool.',
      hint: 'Wait for the pending transaction to confirm, or speed it up in your wallet.',
    };
  }

  // ── Fallback ─────────────────────────────────────────────────────────
  return { message: 'Transaction failed. Check your wallet and try again.' };
}
