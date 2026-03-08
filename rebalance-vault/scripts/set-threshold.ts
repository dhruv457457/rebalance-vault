import { ethers } from "hardhat";

async function main() {
  const DIAMOND = "0x26F9Ec14564B73DC95a79898bce62656a9A5503D";
  const [signer] = await ethers.getSigners();
  
  console.log("Signer:", signer.address);
  
  const admin = await ethers.getContractAt("AdminFacet", DIAMOND);
  
  const tx = await admin.setDriftThreshold(100);
  await tx.wait();
  console.log("Drift threshold set to 100 bps!");
  
  // Also initialize the guard
  const guard = await ethers.getContractAt("GuardFacet", DIAMOND);
  const tx2 = await guard.initializeGuard(194589772200n);
  await tx2.wait();
  console.log("Guard initialized!");
}

main().catch(console.error);