import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const diamondAddress = process.env.DIAMOND_ADDRESS;
  if (!diamondAddress) throw new Error("DIAMOND_ADDRESS not set in .env");

  const [deployer] = await ethers.getSigners();
  const strategyFacet = await ethers.getContractAt("StrategyFacet", diamondAddress);
  const oracle = await ethers.getContractAt("OracleFacet", diamondAddress);

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Switch Strategy");
  console.log("═══════════════════════════════════════════════════════════");

  const [currentAddr, currentName] = await strategyFacet.getActiveStrategy();
  console.log("  Current strategy:", currentName, "at", currentAddr);

  console.log("\nDeploying BandStrategy...");
  const [ethPrice] = await oracle.getEthPrice();

  const BandStrategy = await ethers.getContractFactory("BandStrategy");
  const bandStrategy = await BandStrategy.deploy(300, 10, ethPrice);
  await bandStrategy.waitForDeployment();
  const bandAddr = await bandStrategy.getAddress();
  console.log("  BandStrategy deployed:", bandAddr);
  console.log("  Band width: 300 bps (3%)");
  console.log("  Anchor price:", ethPrice.toString());

  const tx = await strategyFacet.setActiveStrategy(bandAddr);
  await tx.wait();

  const [newAddr, newName] = await strategyFacet.getActiveStrategy();
  console.log("\n  Strategy switched to:", newName, "at", newAddr);

  console.log("\n  Add to .env:");
  console.log(`  BAND_STRATEGY_ADDRESS=${bandAddr}`);
  console.log("═══════════════════════════════════════════════════════════");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});