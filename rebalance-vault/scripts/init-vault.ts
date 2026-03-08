import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const CHAINLINK_ETH_USD = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

async function main() {
  const diamondAddress = process.env.DIAMOND_ADDRESS;
  if (!diamondAddress) throw new Error("DIAMOND_ADDRESS not set");

  console.log("Diamond:", diamondAddress);

  const admin = await ethers.getContractAt("AdminFacet", diamondAddress);

  console.log("1. Initializing vault...");
  const tx = await admin.initializeVault(
    CHAINLINK_ETH_USD, USDC, WETH, UNISWAP_V3_ROUTER,
    5000, 500, 100, 10
  );
  await tx.wait();
  console.log("   Done!");

  console.log("2. Deploying ThresholdStrategy...");
  const Strategy = await ethers.getContractFactory("ThresholdStrategy");
  const strategy = await Strategy.deploy(500, 10);
  await strategy.waitForDeployment();
  const stratAddr = await strategy.getAddress();
  console.log("   Done:", stratAddr);

  console.log("3. Setting strategy...");
  const stratFacet = await ethers.getContractAt("StrategyFacet", diamondAddress);
  await (await stratFacet.setActiveStrategy(stratAddr)).wait();
  console.log("   Done!");

  console.log("4. Deploying UniswapV3Adapter...");
  const Adapter = await ethers.getContractFactory("UniswapV3Adapter");
  const adapter = await Adapter.deploy(UNISWAP_V3_ROUTER, WETH);
  await adapter.waitForDeployment();
  const adapterAddr = await adapter.getAddress();
  console.log("   Done:", adapterAddr);

  console.log("5. Setting adapter...");
  await (await admin.setSwapAdapter(adapterAddr)).wait();
  console.log("   Done!");

  console.log("6. Setting fees...");
  const fee = await ethers.getContractAt("FeeFacet", diamondAddress);
  await (await fee.setFeeParams(200, 2000, (await ethers.getSigners())[0].address)).wait();
  console.log("   Done!");

  console.log("7. Setting guard...");
  const guard = await ethers.getContractAt("GuardFacet", diamondAddress);
  await (await guard.setGuardParams(1000, 5, 100, 2500)).wait();
  console.log("   Done!");

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  All setup complete!");
  console.log("  Diamond:", diamondAddress);
  console.log("  Strategy:", stratAddr);
  console.log("  Adapter:", adapterAddr);
  console.log("═══════════════════════════════════════════════════════════");
}

main().catch(console.error);