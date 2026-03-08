// scripts/test-yield.ts
import { ethers } from "hardhat";

const AAVE_POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const AUSDC = "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c";

async function main() {
  const DIAMOND = "0x26F9Ec14564B73DC95a79898bce62656a9A5503D";

  // Deploy AaveYieldAdapter
  const Aave = await ethers.getContractFactory("AaveYieldAdapter");
  const aave = await Aave.deploy(AAVE_POOL);
  await aave.waitForDeployment();
  const aaveAddr = await aave.getAddress();
  console.log("AaveYieldAdapter:", aaveAddr);

  // Set aToken mapping
  await (await aave.setAToken(USDC, AUSDC)).wait();
  console.log("aUSDC mapped!");

  // Set yield adapter on vault
  const yieldFacet = await ethers.getContractAt("YieldFacet", DIAMOND);
  await (await yieldFacet.setYieldAdapter(aaveAddr)).wait();
  await (await yieldFacet.setYieldEnabled(true)).wait();
  console.log("Yield enabled!");

  // Deposit some USDC to Aave
  const usdcBalance = await yieldFacet.getYieldBalance();
  console.log("Current yield balance:", usdcBalance.toString());

  // Deposit 1000 USDC to yield
  await (await yieldFacet.depositToYield(1000_000000n)).wait();
  console.log("Deposited 1000 USDC to Aave!");

  // Check balance
  const newBalance = await yieldFacet.getYieldBalance();
  console.log("Yield balance after deposit:", newBalance.toString());
}

main().catch(console.error);