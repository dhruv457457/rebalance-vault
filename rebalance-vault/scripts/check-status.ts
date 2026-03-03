import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const vaultAddress = process.env.VAULT_ADDRESS;
  if (!vaultAddress) {
    throw new Error("VAULT_ADDRESS not set in .env");
  }

  const vault = await ethers.getContractAt("RebalanceVault", vaultAddress);
  const provider = ethers.provider;

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  RebalanceVault — Status");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Address: ${vaultAddress}`);
  console.log(`  Block:   ${await provider.getBlockNumber()}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── Portfolio Values ────────────────────────────────────────────────────────
  const [ethValueUsd, usdcValueUsd, totalUsd] = await vault.getPortfolioValue();
  console.log("Portfolio Value:");
  console.log(`  ETH value:   $${formatUsd18(ethValueUsd)}`);
  console.log(`  USDC value:  $${formatUsd18(usdcValueUsd)}`);
  console.log(`  Total value: $${formatUsd18(totalUsd)}`);

  // ── Allocation & Drift ──────────────────────────────────────────────────────
  const drift = await vault.getCurrentDrift();
  const targetBps = await vault.targetAllocationBps();
  const thresholdBps = await vault.driftThresholdBps();
  const maxSlippageBps = await vault.maxSlippageBps();

  const currentEthPct =
    totalUsd > 0n
      ? ((ethValueUsd * 10000n) / totalUsd)
      : 0n;

  console.log("\nAllocation:");
  console.log(`  Target ETH:     ${targetBps.toString()} bps (${Number(targetBps) / 100}%)`);
  console.log(`  Current ETH:    ${currentEthPct.toString()} bps (${Number(currentEthPct) / 100}%)`);
  console.log(`  Drift:          ${drift.toString()} bps`);
  console.log(`  Drift threshold: ${thresholdBps.toString()} bps`);
  console.log(
    `  Rebalance needed: ${Math.abs(Number(drift)) > Number(thresholdBps) ? "YES ✓" : "NO"}`
  );

  // ── Rebalance History ───────────────────────────────────────────────────────
  const rebalanceCount = await vault.rebalanceCount();
  const lastRebalanceBlock = await vault.lastRebalanceBlock();
  const minInterval = await vault.minRebalanceInterval();
  const currentBlock = BigInt(await provider.getBlockNumber());
  const blocksUntilNext =
    lastRebalanceBlock + minInterval > currentBlock
      ? lastRebalanceBlock + minInterval - currentBlock
      : 0n;

  console.log("\nRebalance History:");
  console.log(`  Total rebalances:     ${rebalanceCount.toString()}`);
  console.log(`  Last rebalance block: ${lastRebalanceBlock.toString()}`);
  console.log(`  Min interval:         ${minInterval.toString()} blocks`);
  console.log(
    `  Blocks until next:    ${blocksUntilNext.toString()} blocks`
  );

  // ── Shares & Balances ───────────────────────────────────────────────────────
  const totalShares = await vault.totalShares();
  const ethBalance = await provider.getBalance(vaultAddress);
  const usdcToken = await ethers.getContractAt(
    ["function balanceOf(address) view returns (uint256)"],
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  );
  const usdcBalance = await usdcToken.balanceOf(vaultAddress);

  console.log("\nRaw Balances:");
  console.log(`  ETH balance:   ${ethers.formatEther(ethBalance)} ETH`);
  console.log(`  USDC balance:  ${formatUsdc(usdcBalance)} USDC`);
  console.log(`  Total shares:  ${totalShares.toString()}`);

  // ── Config ──────────────────────────────────────────────────────────────────
  console.log("\nConfiguration:");
  console.log(`  Max slippage:  ${maxSlippageBps.toString()} bps (${Number(maxSlippageBps) / 100}%)`);

  console.log("\n═══════════════════════════════════════════════════════════\n");
}

function formatUsd18(value: bigint): string {
  return (Number(value) / 1e18).toFixed(2);
}

function formatUsdc(value: bigint): string {
  return (Number(value) / 1e6).toFixed(2);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
