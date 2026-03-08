// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct AppStorage {
    mapping(address => uint256) shares;
    uint256 totalShares;

    uint256 targetAllocationBps;
    uint256 driftThresholdBps;
    uint256 maxSlippageBps;

    uint256 rebalanceCount;
    uint256 lastRebalanceBlock;
    uint256 lastRebalancePrice;
    uint256 minRebalanceInterval;
    uint256 totalVolumeSwapped;

    address priceFeed;
    address swapAdapter;
    address yieldAdapter;
    address activeStrategy;
    address usdc;
    address weth;
    address swapRouter;

    uint256 managementFeeBps;
    uint256 performanceFeeBps;
    uint256 highWaterMark;
    uint256 accruedFees;
    uint256 lastFeeTimestamp;
    address feeRecipient;

    uint256 maxSwapSizeBps;
    uint256 maxPriceChangeBps;
    uint256 lastKnownPrice;
    uint256 rebalancesInWindow;
    uint256 windowStartBlock;
    uint256 maxRebalancesPerWindow;
    uint256 windowSizeBlocks;
    bool circuitBreakerTripped;

    uint256 totalDepositedToAave;
    uint256 totalYieldEarned;
    bool yieldEnabled;

    mapping(bytes32 => mapping(address => bool)) roles;

    bool paused;

    uint256 totalGasUsed;
    uint256 totalSlippageLost;
}

function appStorage() pure returns (AppStorage storage s) {
    assembly {
        s.slot := 0
    }
}