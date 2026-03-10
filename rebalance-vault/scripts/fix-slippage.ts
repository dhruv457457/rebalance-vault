import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const diamondAddress = process.env.DIAMOND_ADDRESS;
  if (!diamondAddress) throw new Error("DIAMOND_ADDRESS not set");

  const admin = await ethers.getContractAt("AdminFacet", diamondAddress);

  console.log("Setting max slippage to 300 bps (3%)...");
  const tx = await admin.setMaxSlippage(300);
  await tx.wait();
  console.log("Done!");

  console.log("Setting drift threshold to 100 bps (1%)...");
  const tx2 = await admin.setDriftThreshold(100);
  await tx2.wait();
  console.log("Done!");

  console.log("\nUpdated config:");
  const view = await ethers.getContractAt("ViewFacet", diamondAddress);
  const config = await view.getVaultConfig();
  console.log("  Max slippage:", config.maxSlippageBps.toString(), "bps");
  console.log("  Drift threshold:", config.driftThresholdBps.toString(), "bps");
}

main().catch(console.error);