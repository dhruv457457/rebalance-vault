import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const vaultAddress = process.env.VAULT_ADDRESS;
  if (!vaultAddress) {
    throw new Error("VAULT_ADDRESS not set in .env");
  }

  const [signer] = await ethers.getSigners();
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  RebalanceVault — Deposit Script");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Vault:    ${vaultAddress}`);
  console.log(`  Signer:   ${signer.address}`);
  console.log(
    `  Balance:  ${ethers.formatEther(await ethers.provider.getBalance(signer.address))} ETH`
  );
  console.log("═══════════════════════════════════════════════════════════\n");

  const vault = await ethers.getContractAt("RebalanceVault", vaultAddress, signer);

  // ── Deposit ETH ────────────────────────────────────────────────────────────
  const depositAmount = ethers.parseEther("5");
  console.log(`Depositing ${ethers.formatEther(depositAmount)} ETH...`);

  const tx = await vault.deposit({ value: depositAmount });
  console.log(`  Tx hash: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`  Confirmed in block ${receipt?.blockNumber}\n`);

  // ── Portfolio snapshot after deposit ───────────────────────────────────────
  const [ethValueUsd, usdcValueUsd, totalUsd] = await vault.getPortfolioValue();
  const userShares = await vault.shares(signer.address);
  const totalShares = await vault.totalShares();
  const drift = await vault.getCurrentDrift();

  console.log("Portfolio after deposit:");
  console.log(
    `  ETH value:   $${formatUsd18(ethValueUsd)}`
  );
  console.log(
    `  USDC value:  $${formatUsd18(usdcValueUsd)}`
  );
  console.log(
    `  Total value: $${formatUsd18(totalUsd)}`
  );
  console.log(`  Current drift: ${drift.toString()} bps`);
  console.log(`  Your shares:   ${userShares.toString()}`);
  console.log(`  Total shares:  ${totalShares.toString()}`);
  console.log(
    `\nTip: Deposit USDC via USDC faucet on contract.dev, then call depositUSDC(amount).`
  );
}

function formatUsd18(value: bigint): string {
  return (Number(value) / 1e18).toFixed(2);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
