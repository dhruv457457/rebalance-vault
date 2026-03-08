import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const diamondAddress = process.env.DIAMOND_ADDRESS;
  if (!diamondAddress) throw new Error("DIAMOND_ADDRESS not set in .env");

  const [signer] = await ethers.getSigners();
  const vault = await ethers.getContractAt("VaultFacet", diamondAddress);
  const view = await ethers.getContractAt("ViewFacet", diamondAddress);

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Withdraw from Diamond Vault");
  console.log("═══════════════════════════════════════════════════════════");

  const position = await view.getUserPosition(signer.address);
  console.log("  Your shares:", position.shares.toString());
  console.log("  ETH value:", ethers.formatEther(position.ethValue), "ETH");
  console.log("  USDC value:", position.usdcValue.toString(), "USDC (6 dec)");

  if (position.shares === 0n) {
    console.log("  No shares to withdraw.");
    return;
  }

  const balanceBefore = await ethers.provider.getBalance(signer.address);

  console.log("\nWithdrawing all shares...");
  const tx = await vault.withdraw(position.shares);
  const receipt = await tx.wait();
  console.log("  Tx:", tx.hash);
  console.log("  Block:", receipt?.blockNumber);

  const balanceAfter = await ethers.provider.getBalance(signer.address);
  const ethReceived = balanceAfter - balanceBefore;
  console.log("\n  ETH received: ~" + ethers.formatEther(ethReceived) + " ETH");

  console.log("═══════════════════════════════════════════════════════════");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
