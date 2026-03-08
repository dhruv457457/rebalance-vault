// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AppStorage, appStorage} from "../storage/AppStorage.sol";
import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";
import {PortfolioMath} from "../libraries/PortfolioMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ViewFacet {

    function getPortfolioSummary()
        external
        view
        returns (
            uint256 ethValueUsd,
            uint256 usdcValueUsd,
            uint256 totalUsd,
            int256 currentDrift,
            uint256 targetBps,
            uint256 rebalanceCount,
            uint256 totalShares,
            bool paused
        )
    {
        AppStorage storage s = appStorage();

        uint256 ethBalance = address(this).balance;
        uint256 usdcBalance = IERC20(s.usdc).balanceOf(address(this));

        (uint256 ethPrice, uint8 decimals) = _getEthPrice(s);

        ethValueUsd = PortfolioMath.calculateValueUsd(ethBalance, ethPrice, 18, decimals);
        usdcValueUsd = PortfolioMath.calculateValueUsd(usdcBalance, 1e8, 6, 8);
        totalUsd = ethValueUsd + usdcValueUsd;

        if (totalUsd > 0) {
            uint256 currentEthBps = PortfolioMath.calculateAllocationBps(ethValueUsd, totalUsd);
            currentDrift = PortfolioMath.calculateDrift(currentEthBps, s.targetAllocationBps);
        }

        targetBps = s.targetAllocationBps;
        rebalanceCount = s.rebalanceCount;
        totalShares = s.totalShares;
        paused = s.paused;
    }

    function getSharePrice() external view returns (uint256) {
        AppStorage storage s = appStorage();
        if (s.totalShares == 0) return 0;

        uint256 ethBalance = address(this).balance;
        uint256 usdcBalance = IERC20(s.usdc).balanceOf(address(this));

        (uint256 ethPrice, uint8 decimals) = _getEthPrice(s);

        uint256 ethValueUsd = PortfolioMath.calculateValueUsd(ethBalance, ethPrice, 18, decimals);
        uint256 usdcValueUsd = PortfolioMath.calculateValueUsd(usdcBalance, 1e8, 6, 8);
        uint256 totalUsd = ethValueUsd + usdcValueUsd;

        return (totalUsd * 1e18) / s.totalShares;
    }

    function getUserPosition(address user)
        external
        view
        returns (uint256 shares, uint256 ethValue, uint256 usdcValue)
    {
        AppStorage storage s = appStorage();
        shares = s.shares[user];

        if (shares == 0 || s.totalShares == 0) return (shares, 0, 0);

        ethValue = (address(this).balance * shares) / s.totalShares;
        usdcValue = (IERC20(s.usdc).balanceOf(address(this)) * shares) / s.totalShares;
    }

    function getVaultConfig()
        external
        view
        returns (
            uint256 targetAllocationBps,
            uint256 driftThresholdBps,
            uint256 maxSlippageBps,
            uint256 minRebalanceInterval,
            address activeStrategy,
            address swapAdapter,
            address yieldAdapter,
            address priceFeed
        )
    {
        AppStorage storage s = appStorage();
        targetAllocationBps = s.targetAllocationBps;
        driftThresholdBps = s.driftThresholdBps;
        maxSlippageBps = s.maxSlippageBps;
        minRebalanceInterval = s.minRebalanceInterval;
        activeStrategy = s.activeStrategy;
        swapAdapter = s.swapAdapter;
        yieldAdapter = s.yieldAdapter;
        priceFeed = s.priceFeed;
    }

    function getRebalanceStats()
        external
        view
        returns (
            uint256 rebalanceCount,
            uint256 lastRebalanceBlock,
            uint256 lastRebalancePrice,
            uint256 totalVolumeSwapped,
            uint256 totalGasUsed,
            uint256 totalSlippageLost
        )
    {
        AppStorage storage s = appStorage();
        rebalanceCount = s.rebalanceCount;
        lastRebalanceBlock = s.lastRebalanceBlock;
        lastRebalancePrice = s.lastRebalancePrice;
        totalVolumeSwapped = s.totalVolumeSwapped;
        totalGasUsed = s.totalGasUsed;
        totalSlippageLost = s.totalSlippageLost;
    }

    function getFeeInfo()
        external
        view
        returns (
            uint256 managementFeeBps,
            uint256 performanceFeeBps,
            uint256 highWaterMark,
            uint256 accruedFees,
            address feeRecipient
        )
    {
        AppStorage storage s = appStorage();
        managementFeeBps = s.managementFeeBps;
        performanceFeeBps = s.performanceFeeBps;
        highWaterMark = s.highWaterMark;
        accruedFees = s.accruedFees;
        feeRecipient = s.feeRecipient;
    }

    function getGuardStatus()
        external
        view
        returns (
            bool circuitBreakerTripped,
            uint256 maxPriceChangeBps,
            uint256 lastKnownPrice,
            uint256 rebalancesInWindow,
            uint256 maxRebalancesPerWindow,
            uint256 maxSwapSizeBps
        )
    {
        AppStorage storage s = appStorage();
        circuitBreakerTripped = s.circuitBreakerTripped;
        maxPriceChangeBps = s.maxPriceChangeBps;
        lastKnownPrice = s.lastKnownPrice;
        rebalancesInWindow = s.rebalancesInWindow;
        maxRebalancesPerWindow = s.maxRebalancesPerWindow;
        maxSwapSizeBps = s.maxSwapSizeBps;
    }

    function getYieldInfo()
        external
        view
        returns (
            uint256 totalDepositedToAave,
            uint256 totalYieldEarned,
            bool yieldEnabled
        )
    {
        AppStorage storage s = appStorage();
        totalDepositedToAave = s.totalDepositedToAave;
        totalYieldEarned = s.totalYieldEarned;
        yieldEnabled = s.yieldEnabled;
    }

    function _getEthPrice(AppStorage storage s) internal view returns (uint256 price, uint8 decimals) {
        AggregatorV3Interface feed = AggregatorV3Interface(s.priceFeed);
        decimals = feed.decimals();
        (, int256 answer,,,) = feed.latestRoundData();
        require(answer > 0, "ViewFacet: Invalid price");
        price = uint256(answer);
    }
}
