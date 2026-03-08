// scripts/force-rebalances.ts
import { ethers } from "hardhat";

async function main() {
  const DIAMOND = "0x26F9Ec14564B73DC95a79898bce62656a9A5503D";
  
  const rebalance = await ethers.getContractAt("RebalanceFacet", DIAMOND);
  const admin = await ethers.getContractAt("AdminFacet", DIAMOND);
  const view = await ethers.getContractAt("ViewFacet", DIAMOND);

  console.log("Forcing multiple rebalances by cycling threshold...");

  for (let i = 0; i < 10; i++) {
    console.log(`\n--- Round ${i + 1}/10 ---`);

    // Lower threshold to 1 bps so ANY drift triggers rebalance
    const tx1 = await admin.setDriftThreshold(1);
    await tx1.wait();
    console.log("  Threshold set to 1 bps");

    // Try to rebalance
    try {
      const tx2 = await rebalance.performUpkeep("0x");
      await tx2.wait();
      console.log("  ✅ Rebalanced!");
    } catch (e) {
      console.log("  ⚠️ Rebalance skipped (interval or no drift)");
    }

    // Wait for min interval
    console.log("  Waiting for next block window...");
    await new Promise(r => setTimeout(r, 15000));

    // Check stats
    const stats = await view.getRebalanceStats();
    console.log(`  Total rebalances: ${stats.rebalanceCount}`);
  }

  // Reset threshold back to 100
  await (await admin.setDriftThreshold(100)).wait();
  console.log("\nThreshold reset to 100 bps");
}

main().catch(console.error);