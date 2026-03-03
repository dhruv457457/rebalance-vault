import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { RebalanceVault } from "../typechain-types";

// ─────────────────────────────────────────────────────────────────────────────
// Mock contracts (deployed inline for unit testing)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_PRICE_FEED_ABI = [
  "function setPrice(int256 price) external",
  "function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80)",
  "function decimals() external view returns (uint8)",
];

const MOCK_PRICE_FEED_BYTECODE = `
// SPDX-License-Identifier: MIT
// Inline mock — compiled separately and bytecode embedded
`;

// We deploy actual mock contracts written in Solidity via artifacts
// (see MockContracts.sol below — created for testing purposes only)

describe("RebalanceVault", function () {
  // ── Fixture ────────────────────────────────────────────────────────────────
  async function deployVaultFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock ERC20 (USDC with 6 decimals)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockUsdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUsdc.waitForDeployment();

    // Deploy mock WETH
    const MockWETH = await ethers.getContractFactory("MockWETH");
    const mockWeth = await MockWETH.deploy();
    await mockWeth.waitForDeployment();

    // Deploy mock price feed (ETH/USD @ $2000.00, 8 decimals)
    const MockPriceFeed = await ethers.getContractFactory("MockAggregator");
    const mockPriceFeed = await MockPriceFeed.deploy(
      200000000000n, // $2000 with 8 decimals
      8
    );
    await mockPriceFeed.waitForDeployment();

    // Deploy mock Uniswap router
    const MockRouter = await ethers.getContractFactory("MockSwapRouter");
    const mockRouter = await MockRouter.deploy(
      await mockUsdc.getAddress(),
      await mockWeth.getAddress()
    );
    await mockRouter.waitForDeployment();

    // Deploy RebalanceVault
    const RebalanceVault = await ethers.getContractFactory("RebalanceVault");
    const vault = (await RebalanceVault.deploy(
      await mockPriceFeed.getAddress(),
      await mockRouter.getAddress(),
      await mockUsdc.getAddress(),
      await mockWeth.getAddress(),
      5000, // 50% ETH target
      500,  // 5% drift threshold
      100   // 1% max slippage
    )) as RebalanceVault;
    await vault.waitForDeployment();

    // Mint USDC to user1
    await mockUsdc.mint(user1.address, ethers.parseUnits("10000", 6));

    return { vault, mockUsdc, mockWeth, mockPriceFeed, mockRouter, owner, user1, user2 };
  }

  // ── Deployment ─────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("sets constructor parameters correctly", async function () {
      const { vault, mockPriceFeed, mockRouter, mockUsdc, mockWeth } =
        await loadFixture(deployVaultFixture);

      expect(await vault.targetAllocationBps()).to.equal(5000);
      expect(await vault.driftThresholdBps()).to.equal(500);
      expect(await vault.maxSlippageBps()).to.equal(100);
      expect(await vault.minRebalanceInterval()).to.equal(10);
      expect(await vault.rebalanceCount()).to.equal(0);
    });

    it("reverts with invalid constructor args", async function () {
      const { mockPriceFeed, mockRouter, mockUsdc, mockWeth } =
        await loadFixture(deployVaultFixture);

      const RebalanceVault = await ethers.getContractFactory("RebalanceVault");

      await expect(
        RebalanceVault.deploy(
          ethers.ZeroAddress,
          await mockRouter.getAddress(),
          await mockUsdc.getAddress(),
          await mockWeth.getAddress(),
          5000, 500, 100
        )
      ).to.be.revertedWith("Invalid price feed");

      await expect(
        RebalanceVault.deploy(
          await mockPriceFeed.getAddress(),
          await mockRouter.getAddress(),
          await mockUsdc.getAddress(),
          await mockWeth.getAddress(),
          10001, 500, 100
        )
      ).to.be.revertedWith("Target > 100%");
    });
  });

  // ── Deposits ───────────────────────────────────────────────────────────────
  describe("deposit()", function () {
    it("accepts ETH and issues shares to first depositor", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      const depositAmount = ethers.parseEther("1");
      await expect(
        vault.connect(user1).deposit({ value: depositAmount })
      ).to.emit(vault, "Deposited");

      expect(await vault.shares(user1.address)).to.equal(depositAmount);
      expect(await vault.totalShares()).to.equal(depositAmount);
    });

    it("reverts on zero deposit", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(user1).deposit({ value: 0 })).to.be.revertedWith(
        "Must deposit non-zero ETH"
      );
    });

    it("issues proportional shares to second depositor", async function () {
      const { vault, user1, user2 } = await loadFixture(deployVaultFixture);

      await vault.connect(user1).deposit({ value: ethers.parseEther("1") });
      const sharesBefore = await vault.totalShares();

      await vault.connect(user2).deposit({ value: ethers.parseEther("1") });

      const user2Shares = await vault.shares(user2.address);
      expect(user2Shares).to.be.gt(0n);
      expect(await vault.totalShares()).to.be.gt(sharesBefore);
    });

    it("reverts when paused", async function () {
      const { vault, user1, owner } = await loadFixture(deployVaultFixture);
      await vault.connect(owner).pause();
      await expect(
        vault.connect(user1).deposit({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");
    });
  });

  // ── USDC Deposits ──────────────────────────────────────────────────────────
  describe("depositUSDC()", function () {
    it("accepts USDC and issues shares", async function () {
      const { vault, mockUsdc, user1 } = await loadFixture(deployVaultFixture);

      const amount = ethers.parseUnits("1000", 6);
      await mockUsdc.connect(user1).approve(await vault.getAddress(), amount);

      await expect(vault.connect(user1).depositUSDC(amount)).to.emit(
        vault,
        "Deposited"
      );

      expect(await vault.shares(user1.address)).to.be.gt(0n);
    });

    it("reverts on zero amount", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(user1).depositUSDC(0)).to.be.revertedWith(
        "Must deposit non-zero USDC"
      );
    });
  });

  // ── Withdrawals ────────────────────────────────────────────────────────────
  describe("withdraw()", function () {
    it("burns shares and returns ETH proportionally", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      const depositAmount = ethers.parseEther("2");
      await vault.connect(user1).deposit({ value: depositAmount });

      const shareBalance = await vault.shares(user1.address);
      const ethBefore = await ethers.provider.getBalance(user1.address);

      const tx = await vault.connect(user1).withdraw(shareBalance);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      const ethAfter = await ethers.provider.getBalance(user1.address);
      expect(ethAfter + gasCost).to.be.closeTo(
        ethBefore + depositAmount,
        ethers.parseEther("0.001") // allow small rounding
      );
      expect(await vault.shares(user1.address)).to.equal(0n);
      expect(await vault.totalShares()).to.equal(0n);
    });

    it("reverts if insufficient shares", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      await vault.connect(user1).deposit({ value: ethers.parseEther("1") });
      const shares = await vault.shares(user1.address);
      await expect(vault.connect(user1).withdraw(shares + 1n)).to.be.revertedWith(
        "Insufficient shares"
      );
    });

    it("reverts on zero shares", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(user1).withdraw(0)).to.be.revertedWith(
        "Must withdraw non-zero shares"
      );
    });
  });

  // ── Portfolio View Functions ────────────────────────────────────────────────
  describe("getPortfolioValue()", function () {
    it("returns zero when vault is empty", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      const [ethVal, usdcVal, total] = await vault.getPortfolioValue();
      expect(ethVal).to.equal(0n);
      expect(usdcVal).to.equal(0n);
      expect(total).to.equal(0n);
    });

    it("returns correct USD value after ETH deposit", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      await vault.connect(user1).deposit({ value: ethers.parseEther("1") });

      const [ethVal, , total] = await vault.getPortfolioValue();
      // ETH price = $2000, so 1 ETH = $2000 (18 decimal)
      expect(ethVal).to.equal(ethers.parseEther("2000"));
      expect(total).to.equal(ethers.parseEther("2000"));
    });
  });

  // ── Drift ──────────────────────────────────────────────────────────────────
  describe("getCurrentDrift()", function () {
    it("returns 0 when vault is empty", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.getCurrentDrift()).to.equal(0n);
    });

    it("returns 5000 bps drift when vault is 100% ETH", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      await vault.connect(user1).deposit({ value: ethers.parseEther("1") });
      // 100% ETH, target 50% → drift = 10000 - 5000 = +5000 bps
      expect(await vault.getCurrentDrift()).to.equal(5000n);
    });
  });

  // ── Automation ─────────────────────────────────────────────────────────────
  describe("checkUpkeep()", function () {
    it("returns false when vault is empty", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      const [needed] = await vault.checkUpkeep("0x");
      expect(needed).to.be.false;
    });

    it("returns false when paused", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);
      await vault.connect(user1).deposit({ value: ethers.parseEther("5") });
      await vault.connect(owner).pause();
      const [needed] = await vault.checkUpkeep("0x");
      expect(needed).to.be.false;
    });

    it("returns true when drift exceeds threshold", async function () {
      const { vault, user1, owner } = await loadFixture(deployVaultFixture);
      // Deposit only ETH → 100% ETH → drift = 5000 > threshold 500
      await vault.connect(user1).deposit({ value: ethers.parseEther("5") });
      // Set minRebalanceInterval to 0 so block check passes
      await vault.connect(owner).setMinRebalanceInterval(0);
      const [needed] = await vault.checkUpkeep("0x");
      expect(needed).to.be.true;
    });
  });

  // ── Owner Functions ────────────────────────────────────────────────────────
  describe("Owner functions", function () {
    it("allows owner to set target allocation", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(owner).setTargetAllocation(6000))
        .to.emit(vault, "TargetAllocationUpdated")
        .withArgs(5000, 6000);
      expect(await vault.targetAllocationBps()).to.equal(6000n);
    });

    it("reverts if non-owner sets target allocation", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      await expect(
        vault.connect(user1).setTargetAllocation(6000)
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });

    it("reverts if target exceeds 100%", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);
      await expect(
        vault.connect(owner).setTargetAllocation(10001)
      ).to.be.revertedWith("Exceeds 100%");
    });

    it("allows owner to pause and unpause", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);
      await vault.connect(owner).pause();
      expect(await vault.paused()).to.be.true;
      await vault.connect(owner).unpause();
      expect(await vault.paused()).to.be.false;
    });

    it("allows owner to update drift threshold", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(owner).setDriftThreshold(300))
        .to.emit(vault, "DriftThresholdUpdated")
        .withArgs(500, 300);
    });

    it("reverts on out-of-range drift threshold", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(owner).setDriftThreshold(0)).to.be.revertedWith(
        "Drift threshold out of range"
      );
      await expect(vault.connect(owner).setDriftThreshold(5001)).to.be.revertedWith(
        "Drift threshold out of range"
      );
    });
  });

  // ── PortfolioMath library (via vault) ──────────────────────────────────────
  describe("PortfolioMath integration", function () {
    it("getUserValue returns proportional value", async function () {
      const { vault, user1, user2 } = await loadFixture(deployVaultFixture);

      await vault.connect(user1).deposit({ value: ethers.parseEther("2") });
      await vault.connect(user2).deposit({ value: ethers.parseEther("2") });

      const [eth1] = await vault.getUserValue(user1.address);
      const [eth2] = await vault.getUserValue(user2.address);

      // Both deposited equal amounts so should have roughly equal value
      expect(eth1).to.be.closeTo(eth2, ethers.parseEther("1"));
    });
  });
});
