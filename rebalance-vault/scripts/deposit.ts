import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const diamondAddress = process.env.DIAMOND_ADDRESS;
  if (!diamondAddress) throw new Error("DIAMOND_ADDRESS not set in .env");

  const [signer] = await ethers.getSigners();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Deposit to Diamond Vault");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Diamond:", diamondAddress);
  console.log("  Signer:", signer.address);

  const vault = await ethers.getContractAt("VaultFacet", diamondAddress);
  const view = await ethers.getContractAt("ViewFacet", diamondAddress);

  console.log("\nDepositing 5 ETH...");
  const tx = await vault.deposit({ value: ethers.parseEther("5") });
  const receipt = await tx.wait();
  console.log("  Tx:", tx.hash);
  console.log("  Block:", receipt?.blockNumber);

  const summary = await view.getPortfolioSummary();
  console.log("\nPortfolio after deposit:");
  console.log("  ETH value:  $" + ethers.formatUnits(summary.ethValueUsd, 18));
  console.log("  USDC value: $" + ethers.formatUnits(summary.usdcValueUsd, 18));
  console.log("  Total:      $" + ethers.formatUnits(summary.totalUsd, 18));
  console.log("  Drift:", summary.currentDrift.toString(), "bps");
  console.log("  Shares:", summary.totalShares.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});