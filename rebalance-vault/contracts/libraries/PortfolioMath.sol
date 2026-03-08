// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library PortfolioMath {
    uint256 internal constant BPS_DENOMINATOR = 10_000;
    uint256 internal constant USD_PRECISION = 1e18;

    function calculateValueUsd(
        uint256 amount,
        uint256 priceUsd,
        uint8 tokenDecimals,
        uint8 priceDecimals
    ) internal pure returns (uint256) {
        if (amount == 0) return 0;
        return (amount * priceUsd * USD_PRECISION) / (10 ** tokenDecimals * 10 ** priceDecimals);
    }

    function calculateAllocationBps(
        uint256 partUsd,
        uint256 totalUsd
    ) internal pure returns (uint256) {
        if (totalUsd == 0) return 0;
        return (partUsd * BPS_DENOMINATOR) / totalUsd;
    }

    function calculateDrift(
        uint256 currentBps,
        uint256 targetBps
    ) internal pure returns (int256) {
        return int256(currentBps) - int256(targetBps);
    }

    function calculateSwapAmount(
        uint256 ethValueUsd,
        uint256 usdcValueUsd,
        uint256 targetBps,
        uint256 ethPriceUsd,
        uint8 priceDecimals
    ) internal pure returns (bool sellEth, uint256 amountInTokens) {
        uint256 totalUsd = ethValueUsd + usdcValueUsd;
        if (totalUsd == 0) return (false, 0);

        uint256 targetEthUsd = (totalUsd * targetBps) / BPS_DENOMINATOR;

        if (ethValueUsd > targetEthUsd) {
            sellEth = true;
            uint256 excessUsd = ethValueUsd - targetEthUsd;
            amountInTokens = (excessUsd * (10 ** priceDecimals)) / ethPriceUsd;
        } else {
            sellEth = false;
            uint256 deficitUsd = targetEthUsd - ethValueUsd;
            amountInTokens = deficitUsd / USD_PRECISION;
        }
    }

    function abs(int256 x) internal pure returns (uint256) {
        return x >= 0 ? uint256(x) : uint256(-x);
    }
}