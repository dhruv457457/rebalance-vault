import { ethers } from "hardhat";

// ─────────────────────────────────────────────────────────────────────────────
// Ethereum Mainnet addresses (Stagenet replays mainnet state)
// ─────────────────────────────────────────────────────────────────────────────
const CHAINLINK_ETH_USD = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

// ─────────────────────────────────────────────────────────────────────────────
// Vault configuration
// ─────────────────────────────────────────────────────────────────────────────
const TARGET_ALLOCATION_BPS = 5000; // 50% ETH / 50% USDC
const DRIFT_THRESHOLD_BPS = 500;   // 5% drift triggers rebalance
const MAX_SLIPPAGE_BPS = 100;      // 1% max slippage on swaps

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  RebalanceVault — Deploy Script");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Deployer:         ${deployer.address}`);
  console.log(
    `  Balance:          ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`
  );
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("Constructor arguments:");
  console.log(`  priceFeed:             ${CHAINLINK_ETH_USD} (Chainlink ETH/USD)`);
  console.log(`  swapRouter:            ${UNISWAP_V3_ROUTER} (Uniswap V3)`);
  console.log(`  usdc:                  ${USDC_ADDRESS}`);
  console.log(`  weth:                  ${WETH_ADDRESS}`);
  console.log(`  targetAllocationBps:   ${TARGET_ALLOCATION_BPS} (50% ETH)`);
  console.log(`  driftThresholdBps:     ${DRIFT_THRESHOLD_BPS} (5% drift)`);
  console.log(`  maxSlippageBps:        ${MAX_SLIPPAGE_BPS} (1% slippage)\n`);

  console.log("Deploying RebalanceVault...");
  const RebalanceVault = await ethers.getContractFactory("RebalanceVault");
  const vault = await RebalanceVault.deploy(
    CHAINLINK_ETH_USD,
    UNISWAP_V3_ROUTER,
    USDC_ADDRESS,
    WETH_ADDRESS,
    TARGET_ALLOCATION_BPS,
    DRIFT_THRESHOLD_BPS,
    MAX_SLIPPAGE_BPS
  );

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Deployment Successful!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Contract address: ${vaultAddress}`);
  console.log(`  Tx hash:          ${vault.deploymentTransaction()?.hash}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("Next steps:");
  console.log(`  1. Add this to your .env:`);
  console.log(`     VAULT_ADDRESS=${vaultAddress}`);
  console.log(`  2. Deposit ETH:  npx hardhat run scripts/deposit.ts --network stagenet`);
  console.log(`  3. Check status: npx hardhat run scripts/check-status.ts --network stagenet`);
  console.log(`  4. Register Chainlink Automation on contract.dev pointing to:`);
  console.log(`     ${vaultAddress}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
