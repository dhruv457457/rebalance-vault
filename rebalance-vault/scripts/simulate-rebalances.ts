import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const ITERATIONS = 20;
const SLEEP_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const diamondAddress = process.env.DIAMOND_ADDRESS;
  if (!diamondAddress) throw new Error("DIAMOND_ADDRESS not set in .env");

  const [signer] = await ethers.getSigners();
  const rebalance = await ethers.getContractAt("RebalanceFacet", diamondAddress);
  const view = await ethers.getContractAt("ViewFacet", diamondAddress);
  const oracle = await ethers.getContractAt("OracleFacet", diamondAddress);

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Diamond Vault — Simulate Rebalances");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Diamond:", diamondAddress);
  console.log("  Iterations:", ITERATIONS);
  console.log("═══════════════════════════════════════════════════════════\n");

  let totalRebalances = 0;

  for (let i = 1; i <= ITERATIONS; i++) {
    const block = await ethers.provider.getBlockNumber();
    console.log(`─── Iteration ${i}/${ITERATIONS}  (block ${block}) ───`);

    try {
      const [upkeepNeeded] = await rebalance.checkUpkeep("0x");

      if (upkeepNeeded) {
        const drift = await oracle.getCurrentDrift();
        console.log("  Rebalance needed! Drift:", drift.toString(), "bps");

        const tx = await rebalance.performUpkeep("0x");
        const receipt = await tx.wait();
        console.log("  Tx:", tx.hash);
        console.log("  Block:", receipt?.blockNumber);
        totalRebalances++;

        const newDrift = await oracle.getCurrentDrift();
        console.log("  Drift after:", newDrift.toString(), "bps");
      } else {
        const drift = await oracle.getCurrentDrift();
        console.log("  No rebalance needed. Drift:", drift.toString(), "bps");
      }

      if (i % 5 === 0) {
        const summary = await view.getPortfolioSummary();
        console.log("\n  Portfolio snapshot:");
        console.log("    ETH:   $" + ethers.formatUnits(summary.ethValueUsd, 18));
        console.log("    USDC:  $" + ethers.formatUnits(summary.usdcValueUsd, 18));
        console.log("    Total: $" + ethers.formatUnits(summary.totalUsd, 18));
        console.log("");
      }
    } catch (error: any) {
      console.log("  Error:", error.message?.substring(0, 100));
    }

    if (i < ITERATIONS) {
      console.log("  Waiting " + SLEEP_MS / 1000 + "s...\n");
      await sleep(SLEEP_MS);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Simulation Complete");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Rebalances this session:", totalRebalances);

  const stats = await view.getRebalanceStats();
  console.log("  Total rebalances (all time):", stats.rebalanceCount.toString());
  console.log("  Total volume:", stats.totalVolumeSwapped.toString());
  console.log("  Total gas:", stats.totalGasUsed.toString());

  const summary = await view.getPortfolioSummary();
  console.log("\n  Final state:");
  console.log("    ETH:   $" + ethers.formatUnits(summary.ethValueUsd, 18));
  console.log("    USDC:  $" + ethers.formatUnits(summary.usdcValueUsd, 18));
  console.log("    Total: $" + ethers.formatUnits(summary.totalUsd, 18));
  console.log("    Drift: " + summary.currentDrift.toString() + " bps");
  console.log("═══════════════════════════════════════════════════════════");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});