import { ethers } from "hardhat";

const CHAINLINK_ETH_USD = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

function getSelectors(contract: any): string[] {
  const signatures = Object.keys(contract.interface.fragments
    .filter((f: any) => f.type === "function")
    .reduce((acc: any, f: any) => {
      acc[f.format("sighash")] = true;
      return acc;
    }, {}));

  return contract.interface.fragments
    .filter((f: any) => f.type === "function")
    .map((f: any) => contract.interface.getFunction(f.name)!.selector);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  RebalanceVault Diamond — Deploy");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Deployer:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("  Balance:", ethers.formatEther(balance), "ETH");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Step 1: Deploy DiamondCutFacet
  console.log("1. Deploying DiamondCutFacet...");
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.waitForDeployment();
  console.log("   Address:", await diamondCutFacet.getAddress());

  // Step 2: Deploy Diamond
  console.log("2. Deploying Diamond...");
  const Diamond = await ethers.getContractFactory("Diamond");
  const diamond = await Diamond.deploy(deployer.address, await diamondCutFacet.getAddress());
  await diamond.waitForDeployment();
  const diamondAddress = await diamond.getAddress();
  console.log("   Address:", diamondAddress);

  // Step 3: Deploy all facets
  console.log("3. Deploying facets...");

  const facetNames = [
    "DiamondLoupeFacet",
    "OwnershipFacet",
    "OracleFacet",
    "VaultFacet",
    "ViewFacet",
    "StrategyFacet",
    "RebalanceFacet",
    "GuardFacet",
    "FeeFacet",
    "YieldFacet",
    "AdminFacet",
  ];

  const facets: any[] = [];
  for (const name of facetNames) {
    const Factory = await ethers.getContractFactory(name);
    const facet = await Factory.deploy();
    await facet.waitForDeployment();
    console.log(`   ${name}: ${await facet.getAddress()}`);
    facets.push({ name, contract: facet });
  }

  // Step 4: Build diamond cuts
  console.log("4. Registering facets on Diamond...");

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };
  const cuts: any[] = [];

  for (const { name, contract: facet } of facets) {
    const selectors = getSelectors(facet);
    if (selectors.length > 0) {
      cuts.push({
        facetAddress: await facet.getAddress(),
        action: FacetCutAction.Add,
        functionSelectors: selectors,
      });
      console.log(`   ${name}: ${selectors.length} functions`);
    }
  }

  // Step 5: Execute diamond cut
  const diamondCut = await ethers.getContractAt("IDiamondCut", diamondAddress);
  const tx = await diamondCut.diamondCut(cuts, ethers.ZeroAddress, "0x");
  await tx.wait();
  console.log("   Diamond cut executed!");

  // Step 6: Initialize vault via AdminFacet
  console.log("5. Initializing vault...");
  const adminFacet = await ethers.getContractAt("AdminFacet", diamondAddress);
  const initTx = await adminFacet.initializeVault(
    CHAINLINK_ETH_USD,
    USDC,
    WETH,
    UNISWAP_V3_ROUTER,
    5000,  // 50% ETH target
    500,   // 5% drift threshold
    100,   // 1% max slippage
    10     // min 10 blocks between rebalances
  );
  await initTx.wait();
  console.log("   Vault initialized!");

  // Step 7: Deploy and set ThresholdStrategy
  console.log("6. Deploying ThresholdStrategy...");
  const ThresholdStrategy = await ethers.getContractFactory("ThresholdStrategy");
  const strategy = await ThresholdStrategy.deploy(500, 10);
  await strategy.waitForDeployment();
  const strategyAddress = await strategy.getAddress();
  console.log("   Address:", strategyAddress);

  const strategyFacet = await ethers.getContractAt("StrategyFacet", diamondAddress);
  const setStratTx = await strategyFacet.setActiveStrategy(strategyAddress);
  await setStratTx.wait();
  console.log("   Strategy set!");

  // Step 8: Deploy and set UniswapV3Adapter
  console.log("7. Deploying UniswapV3Adapter...");
  const UniswapV3Adapter = await ethers.getContractFactory("UniswapV3Adapter");
  const adapter = await UniswapV3Adapter.deploy(UNISWAP_V3_ROUTER, WETH);
  await adapter.waitForDeployment();
  const adapterAddress = await adapter.getAddress();
  console.log("   Address:", adapterAddress);

  const setAdapterTx = await adminFacet.setSwapAdapter(adapterAddress);
  await setAdapterTx.wait();
  console.log("   Adapter set!");

  // Step 9: Set up fees
  console.log("8. Setting up fees...");
  const feeFacet = await ethers.getContractAt("FeeFacet", diamondAddress);
  const feeTx = await feeFacet.setFeeParams(200, 2000, deployer.address);
  await feeTx.wait();
  console.log("   Fees: 2% management, 20% performance");

  // Step 10: Set up guard
  console.log("9. Setting up guard...");
  const guardFacet = await ethers.getContractAt("GuardFacet", diamondAddress);
  const guardTx = await guardFacet.setGuardParams(1000, 5, 100, 2500);
  await guardTx.wait();
  console.log("   Guard: 10% max price change, 5 rebalances/100 blocks, 25% max swap");

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Deployment Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Diamond:           ", diamondAddress);
  console.log("  ThresholdStrategy: ", strategyAddress);
  console.log("  UniswapV3Adapter:  ", adapterAddress);
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n  Add to .env:");
  console.log(`  DIAMOND_ADDRESS=${diamondAddress}`);
  console.log(`  STRATEGY_ADDRESS=${strategyAddress}`);
  console.log(`  ADAPTER_ADDRESS=${adapterAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});