import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const diamondAddress = process.env.DIAMOND_ADDRESS;
  if (!diamondAddress) throw new Error("DIAMOND_ADDRESS not set in .env");

  const view = await ethers.getContractAt("ViewFacet", diamondAddress);

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Diamond Vault — Status");
  console.log("═══════════════════════════════════════════════════════════");

  const summary = await view.getPortfolioSummary();
  console.log("\n📊 Portfolio:");
  console.log("  ETH value:   $" + ethers.formatUnits(summary.ethValueUsd, 18));
  console.log("  USDC value:  $" + ethers.formatUnits(summary.usdcValueUsd, 18));
  console.log("  Total:       $" + ethers.formatUnits(summary.totalUsd, 18));
  console.log("  Drift:       " + summary.currentDrift.toString() + " bps");
  console.log("  Target:      " + summary.targetBps.toString() + " bps");
  console.log("  Shares:      " + summary.totalShares.toString());
  console.log("  Paused:      " + summary.paused);

  const stats = await view.getRebalanceStats();
  console.log("\n🔄 Rebalance Stats:");
  console.log("  Count:           " + stats.rebalanceCount.toString());
  console.log("  Last block:      " + stats.lastRebalanceBlock.toString());
  console.log("  Last price:      " + stats.lastRebalancePrice.toString());
  console.log("  Volume swapped:  " + stats.totalVolumeSwapped.toString());
  console.log("  Gas used:        " + stats.totalGasUsed.toString());
  console.log("  Slippage lost:   " + stats.totalSlippageLost.toString());

  const config = await view.getVaultConfig();
  console.log("\n⚙️  Config:");
  console.log("  Target:      " + config.targetAllocationBps.toString() + " bps");
  console.log("  Drift thresh:" + config.driftThresholdBps.toString() + " bps");
  console.log("  Max slippage:" + config.maxSlippageBps.toString() + " bps");
  console.log("  Min interval:" + config.minRebalanceInterval.toString() + " blocks");
  console.log("  Strategy:    " + config.activeStrategy);
  console.log("  Swap adapter:" + config.swapAdapter);

  const fees = await view.getFeeInfo();
  console.log("\n💰 Fees:");
  console.log("  Management:  " + fees.managementFeeBps.toString() + " bps");
  console.log("  Performance: " + fees.performanceFeeBps.toString() + " bps");
  console.log("  High water:  " + fees.highWaterMark.toString());
  console.log("  Accrued:     " + fees.accruedFees.toString());
  console.log("  Recipient:   " + fees.feeRecipient);

  const guard = await view.getGuardStatus();
  console.log("\n🛡️  Guard:");
  console.log("  Circuit breaker: " + guard.circuitBreakerTripped);
  console.log("  Max price chg:   " + guard.maxPriceChangeBps.toString() + " bps");
  console.log("  Last price:      " + guard.lastKnownPrice.toString());
  console.log("  Rebal in window: " + guard.rebalancesInWindow.toString());
  console.log("  Max per window:  " + guard.maxRebalancesPerWindow.toString());
  console.log("  Max swap size:   " + guard.maxSwapSizeBps.toString() + " bps");

  const yield_ = await view.getYieldInfo();
  console.log("\n🌱 Yield:");
  console.log("  Deposited:   " + yield_.totalDepositedToAave.toString());
  console.log("  Earned:      " + yield_.totalYieldEarned.toString());
  console.log("  Enabled:     " + yield_.yieldEnabled);

  const sharePrice = await view.getSharePrice();
  console.log("\n📈 Share Price: $" + ethers.formatUnits(sharePrice, 18));

  console.log("\n═══════════════════════════════════════════════════════════");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});