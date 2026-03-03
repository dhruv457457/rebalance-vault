import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const ITERATIONS = 20;
const SLEEP_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatUsd18(value: bigint): string {
  return (Number(value) / 1e18).toFixed(2);
}

async function main() {
  const vaultAddress = process.env.VAULT_ADDRESS;
  if (!vaultAddress) {
    throw new Error("VAULT_ADDRESS not set in .env");
  }

  const [signer] = await ethers.getSigners();
  const vault = await ethers.getContractAt("RebalanceVault", vaultAddress, signer);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  RebalanceVault — Simulate Rebalances");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Vault:      ${vaultAddress}`);
  console.log(`  Signer:     ${signer.address}`);
  console.log(`  Iterations: ${ITERATIONS} (${SLEEP_MS / 1000}s between each)`);
  console.log("═══════════════════════════════════════════════════════════\n");

  let totalRebalances = 0;

  for (let i = 1; i <= ITERATIONS; i++) {
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log(`─── Iteration ${i}/${ITERATIONS}  (block ${currentBlock}) ───`);

    try {
      // Check if upkeep is needed
      const [upkeepNeeded] = await vault.checkUpkeep("0x");
      const drift = await vault.getCurrentDrift();
      const absDrift = drift < 0n ? -drift : drift;

      if (upkeepNeeded) {
        console.log(`  Rebalance needed! Drift: ${drift.toString()} bps`);

        const tx = await vault.performUpkeep("0x");
        console.log(`  Tx submitted: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`  Confirmed in block ${receipt?.blockNumber}`);

        // Parse Rebalanced event
        const rebalancedEvent = receipt?.logs
          .map((log) => {
            try {
              return vault.interface.parseLog(log);
            } catch {
              return null;
            }
          })
          .find((e) => e?.name === "Rebalanced");

        if (rebalancedEvent) {
          const { soldEth, swapAmount, driftBefore, driftAfter } =
            rebalancedEvent.args;
          console.log(`  Direction:    ${soldEth ? "Sold ETH → USDC" : "Sold USDC → ETH"}`);
          console.log(
            `  Swap amount:  ${soldEth ? ethers.formatEther(swapAmount) + " ETH" : (Number(swapAmount) / 1e6).toFixed(2) + " USDC"}`
          );
          console.log(`  Drift before: ${driftBefore.toString()} bps`);
          console.log(`  Drift after:  ${driftAfter.toString()} bps`);
        }

        totalRebalances++;
      } else {
        console.log(`  No rebalance needed. Current drift: ${drift.toString()} bps (threshold: >${(await vault.driftThresholdBps()).toString()} bps)`);
      }

      // Print portfolio snapshot every 5 iterations
      if (i % 5 === 0) {
        const [ethValueUsd, usdcValueUsd, totalUsd] =
          await vault.getPortfolioValue();
        console.log("\n  Portfolio snapshot:");
        console.log(`    ETH value:   $${formatUsd18(ethValueUsd)}`);
        console.log(`    USDC value:  $${formatUsd18(usdcValueUsd)}`);
        console.log(`    Total value: $${formatUsd18(totalUsd)}\n`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  Error: ${message.slice(0, 120)}`);
    }

    if (i < ITERATIONS) {
      console.log(`  Waiting ${SLEEP_MS / 1000}s...\n`);
      await sleep(SLEEP_MS);
    }
  }

  // ── Final Summary ───────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Simulation Complete");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Rebalances triggered this session: ${totalRebalances}`);
  console.log(`  Total rebalances (all time):       ${await vault.rebalanceCount()}`);
  console.log(`  Last rebalance block:              ${await vault.lastRebalanceBlock()}`);

  const [ethValueUsd, usdcValueUsd, totalUsd] = await vault.getPortfolioValue();
  const drift = await vault.getCurrentDrift();
  console.log("\n  Final portfolio state:");
  console.log(`    ETH value:   $${formatUsd18(ethValueUsd)}`);
  console.log(`    USDC value:  $${formatUsd18(usdcValueUsd)}`);
  console.log(`    Total value: $${formatUsd18(totalUsd)}`);
  console.log(`    Drift:       ${drift.toString()} bps`);
  console.log("═══════════════════════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
