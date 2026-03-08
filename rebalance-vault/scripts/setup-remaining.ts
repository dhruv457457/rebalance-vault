import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

async function main() {
  const diamondAddress = process.env.DIAMOND_ADDRESS;
  if (!diamondAddress) throw new Error("DIAMOND_ADDRESS not set in .env");

  const [deployer] = await ethers.getSigners();
  console.log("Diamond:", diamondAddress);
  console.log("Deployer:", deployer.address);

  // Deploy ThresholdStrategy
  console.log("\n1. Deploying ThresholdStrategy...");
  const ThresholdStrategy = await ethers.getContractFactory("ThresholdStrategy");
  const strategy = await ThresholdStrategy.deploy(500, 10);
  await strategy.waitForDeployment();
  const strategyAddr = await strategy.getAddress();
  console.log("   Done:", strategyAddr);

  // Set strategy
  console.log("2. Setting strategy...");
  const strategyFacet = await ethers.getContractAt("StrategyFacet", diamondAddress);
  const tx1 = await strategyFacet.setActiveStrategy(strategyAddr);
  await tx1.wait();
  console.log("   Done!");

  // Deploy UniswapV3Adapter
  console.log("3. Deploying UniswapV3Adapter...");
  const Adapter = await ethers.getContractFactory("UniswapV3Adapter");
  const adapter = await Adapter.deploy(UNISWAP_V3_ROUTER, WETH);
  await adapter.waitForDeployment();
  const adapterAddr = await adapter.getAddress();
  console.log("   Done:", adapterAddr);

  // Set adapter
  console.log("4. Setting adapter...");
  const adminFacet = await ethers.getContractAt("AdminFacet", diamondAddress);
  const tx2 = await adminFacet.setSwapAdapter(adapterAddr);
  await tx2.wait();
  console.log("   Done!");

  // Set fees
  console.log("5. Setting fees...");
  const feeFacet = await ethers.getContractAt("FeeFacet", diamondAddress);
  const tx3 = await feeFacet.setFeeParams(200, 2000, deployer.address);
  await tx3.wait();
  console.log("   Done! 2% management, 20% performance");

  // Set guard
  console.log("6. Setting guard...");
  const guardFacet = await ethers.getContractAt("GuardFacet", diamondAddress);
  const tx4 = await guardFacet.setGuardParams(1000, 5, 100, 2500);
  await tx4.wait();
  console.log("   Done! 10% max price change, 5 rebal/window, 25% max swap");

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Setup Complete!");
  console.log("  Strategy:", strategyAddr);
  console.log("  Adapter:", adapterAddr);
  console.log("═══════════════════════════════════════════════════════════");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
