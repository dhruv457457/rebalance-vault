// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRebalanceStrategy} from "./IRebalanceStrategy.sol";
import {PortfolioMath} from "../libraries/PortfolioMath.sol";

contract ThresholdStrategy is IRebalanceStrategy {
    uint256 public immutable driftThresholdBps;
    uint256 public immutable minBlockInterval;

    constructor(uint256 _driftThresholdBps, uint256 _minBlockInterval) {
        driftThresholdBps = _driftThresholdBps;
        minBlockInterval = _minBlockInterval;
    }

    function shouldRebalance(
        uint256 ethValueUsd,
        uint256 usdcValueUsd,
        uint256 targetBps,
        uint256 lastRebalanceBlock
    ) external view override returns (bool) {
        if (block.number < lastRebalanceBlock + minBlockInterval) return false;

        uint256 totalUsd = ethValueUsd + usdcValueUsd;
        if (totalUsd == 0) return false;

        uint256 currentBps = PortfolioMath.calculateAllocationBps(ethValueUsd, totalUsd);
        int256 drift = PortfolioMath.calculateDrift(currentBps, targetBps);
        uint256 absDrift = PortfolioMath.abs(drift);

        return absDrift > driftThresholdBps;
    }

    function calculateSwap(
        uint256 ethValueUsd,
        uint256 usdcValueUsd,
        uint256 targetBps,
        uint256 ethPrice,
        uint8 priceDecimals
    ) external pure override returns (bool sellEth, uint256 amount) {
        return PortfolioMath.calculateSwapAmount(
            ethValueUsd, usdcValueUsd, targetBps, ethPrice, priceDecimals
        );
    }

    function name() external pure override returns (string memory) {
        return "ThresholdStrategy";
    }
}