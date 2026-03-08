import { artifacts } from "hardhat";
import * as fs from "fs";

async function main() {
  const facetNames = [
    "VaultFacet",
    "RebalanceFacet",
    "OracleFacet",
    "ViewFacet",
    "StrategyFacet",
    "GuardFacet",
    "FeeFacet",
    "YieldFacet",
    "AdminFacet",
    "DiamondLoupeFacet",
    "OwnershipFacet",
  ];

  const combined: any[] = [];
  const seen = new Set<string>();

  for (const name of facetNames) {
    const artifact = await artifacts.readArtifact(name);
    for (const item of artifact.abi) {
      const key = JSON.stringify(item);
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(item);
      }
    }
  }

  fs.writeFileSync("diamond-abi.json", JSON.stringify(combined, null, 2));
  console.log("Combined ABI written to diamond-abi.json");
  console.log("Total functions:", combined.filter((x: any) => x.type === "function").length);
  console.log("Total events:", combined.filter((x: any) => x.type === "event").length);
}

main().catch(console.error);