// scripts/set-final-config.ts
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const DIAMOND = process.env.DIAMOND_ADDRESS!;
  const admin = await ethers.getContractAt("AdminFacet", DIAMOND);

  // Keep 1000 bps slippage since that's what works
  await (await admin.setMaxSlippage(1000)).wait();
  console.log("✅ Slippage: 1000 bps");

  // Keep drift threshold at 100 bps for more rebalances
  await (await admin.setDriftThreshold(100)).wait();
  console.log("✅ Drift threshold: 100 bps");

  // Set interval back to 10 blocks (reasonable)
  await (await admin.setMinRebalanceInterval(10)).wait();
  console.log("✅ Min interval: 10 blocks");

  console.log("\nAll config set! Now run simulate multiple times.");
}

main().catch(console.error);