// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library SwapMath {
    uint256 internal constant BPS_DENOMINATOR = 10_000;

    function calculateMinOutput(
        uint256 expectedOut,
        uint256 slippageBps
    ) internal pure returns (uint256) {
        return (expectedOut * (BPS_DENOMINATOR - slippageBps)) / BPS_DENOMINATOR;
    }

    function calculatePriceImpact(
        uint256 amountIn,
        uint256 amountOut,
        uint256 expectedOut
    ) internal pure returns (uint256 impactBps) {
        if (expectedOut == 0 || amountIn == 0) return 0;
        if (amountOut >= expectedOut) return 0;
        impactBps = ((expectedOut - amountOut) * BPS_DENOMINATOR) / expectedOut;
    }

    function calculateExpectedUsdcOut(
        uint256 ethAmountWei,
        uint256 ethPriceUsd,
        uint8 priceDecimals
    ) internal pure returns (uint256 usdcAmount) {
        usdcAmount = (ethAmountWei * ethPriceUsd) / (10 ** priceDecimals * 1e12);
    }

    function calculateExpectedWethOut(
        uint256 usdcAmount,
        uint256 ethPriceUsd,
        uint8 priceDecimals
    ) internal pure returns (uint256 wethAmount) {
        if (ethPriceUsd == 0) return 0;
        wethAmount = (usdcAmount * (10 ** priceDecimals) * 1e12) / ethPriceUsd;
    }

    function splitSwapAmount(
        uint256 total,
        uint256 chunks
    ) internal pure returns (uint256 perChunk) {
        if (chunks == 0) return total;
        perChunk = total / chunks;
    }
}