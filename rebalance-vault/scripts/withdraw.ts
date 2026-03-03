import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const vaultAddress = process.env.VAULT_ADDRESS;
  if (!vaultAddress) {
    throw new Error("VAULT_ADDRESS not set in .env");
  }

  const [signer] = await ethers.getSigners();
  const vault = await ethers.getContractAt("RebalanceVault", vaultAddress, signer);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  RebalanceVault — Withdraw Script");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Vault:   ${vaultAddress}`);
  console.log(`  Signer:  ${signer.address}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  const userShares = await vault.shares(signer.address);
  if (userShares === 0n) {
    console.log("No shares to withdraw. Exiting.");
    return;
  }

  const totalShares = await vault.totalShares();
  const ethBalance = await ethers.provider.getBalance(vaultAddress);
  const usdcToken = await ethers.getContractAt(
    ["function balanceOf(address) view returns (uint256)"],
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  );
  const usdcBalance = await usdcToken.balanceOf(vaultAddress);

  // Calculate expected amounts
  const expectedEth = (ethBalance * userShares) / totalShares;
  const expectedUsdc = (usdcBalance * userShares) / totalShares;

  const [ethValueUsd, usdcValueUsd] = await vault.getUserValue(signer.address);

  console.log("Your position:");
  console.log(`  Shares:         ${userShares.toString()}`);
  console.log(`  Share of pool:  ${(Number((userShares * 10000n) / totalShares) / 100).toFixed(2)}%`);
  console.log(`  Expected ETH:   ${ethers.formatEther(expectedEth)} ETH`);
  console.log(`  Expected USDC:  ${(Number(expectedUsdc) / 1e6).toFixed(2)} USDC`);
  console.log(`  ETH value:      $${(Number(ethValueUsd) / 1e18).toFixed(2)}`);
  console.log(`  USDC value:     $${(Number(usdcValueUsd) / 1e18).toFixed(2)}\n`);

  const ethBefore = await ethers.provider.getBalance(signer.address);

  console.log(`Withdrawing ${userShares.toString()} shares...`);
  const tx = await vault.withdraw(userShares);
  console.log(`  Tx hash: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`  Confirmed in block ${receipt?.blockNumber}\n`);

  const ethAfter = await ethers.provider.getBalance(signer.address);
  const gasCost = receipt ? receipt.gasUsed * (receipt.gasPrice ?? 0n) : 0n;
  const ethNetReceived = ethAfter - ethBefore + gasCost;

  console.log("Withdrawal complete:");
  console.log(`  ETH received (net of gas): ${ethers.formatEther(ethNetReceived)} ETH`);
  console.log(`  Gas used:                  ${receipt?.gasUsed.toString()} units`);
  console.log(`  Remaining shares:          ${await vault.shares(signer.address)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
