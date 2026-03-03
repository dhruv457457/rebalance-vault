// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PortfolioMath
/// @notice Pure math library for portfolio allocation and rebalancing calculations
/// @dev All USD values are normalized to 18 decimal precision internally
library PortfolioMath {
    uint256 internal constant BPS_DENOMINATOR = 10_000;

    /// @notice Converts a token amount to its USD value normalized to 18 decimals
    /// @param amount The token amount (in token's native decimals)
    /// @param priceUsd The token price in USD (in priceDecimals precision)
    /// @param tokenDecimals The number of decimals the token uses
    /// @param priceDecimals The number of decimals the price feed uses
    /// @return valueUsd The USD value normalized to 18 decimals
    function calculateValueUsd(
        uint256 amount,
        uint256 priceUsd,
        uint8 tokenDecimals,
        uint8 priceDecimals
    ) internal pure returns (uint256 valueUsd) {
        // Normalize: (amount * priceUsd * 1e18) / (10^tokenDecimals * 10^priceDecimals)
        // To avoid overflow: divide by token decimals first, then multiply
        valueUsd =
            (amount * priceUsd * 1e18) /
            (10 ** uint256(tokenDecimals) * 10 ** uint256(priceDecimals));
    }

    /// @notice Returns what percentage (in BPS) partUsd is of totalUsd
    /// @param partUsd The portion of the portfolio (18 decimal USD value)
    /// @param totalUsd The total portfolio value (18 decimal USD value)
    /// @return allocationBps Allocation in basis points (10000 = 100%)
    function calculateAllocationBps(
        uint256 partUsd,
        uint256 totalUsd
    ) internal pure returns (uint256 allocationBps) {
        if (totalUsd == 0) return 0;
        allocationBps = (partUsd * BPS_DENOMINATOR) / totalUsd;
    }

    /// @notice Returns signed drift from target allocation
    /// @param currentBps Current allocation in basis points
    /// @param targetBps Target allocation in basis points
    /// @return driftBps Signed drift (positive = over-allocated, negative = under-allocated)
    function calculateDrift(
        uint256 currentBps,
        uint256 targetBps
    ) internal pure returns (int256 driftBps) {
        driftBps = int256(currentBps) - int256(targetBps);
    }

    /// @notice Calculates how much to swap to restore the target ETH allocation
    /// @param ethValueUsd Current ETH portfolio value (18 decimal USD)
    /// @param usdcValueUsd Current USDC portfolio value (18 decimal USD)
    /// @param targetBps Target ETH allocation in basis points
    /// @param ethPriceUsd Current ETH price in USD (in priceDecimals precision)
    /// @param priceDecimals Decimals used by the price feed
    /// @return sellEth True if we should sell ETH (buy USDC), false if we should sell USDC (buy ETH)
    /// @return amountInTokens Amount to swap in the source token's native decimals
    ///                        (wei for ETH, 6-decimal units for USDC)
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
            // ETH is over-allocated — sell ETH to buy USDC
            sellEth = true;
            uint256 usdDiff = ethValueUsd - targetEthUsd;
            // Convert USD difference to ETH amount (in wei)
            // amountEth = usdDiff * 10^priceDecimals / ethPriceUsd
            // Then scale from 18-decimal USD value to wei:
            // usdDiff is already 18-decimal, ethPriceUsd has priceDecimals
            // wei = usdDiff * 10^priceDecimals / ethPriceUsd  (result is 18 decimals = wei)
            amountInTokens =
                (usdDiff * 10 ** uint256(priceDecimals)) /
                ethPriceUsd;
        } else {
            // USDC is over-allocated — sell USDC to buy ETH
            sellEth = false;
            uint256 usdDiff = targetEthUsd - ethValueUsd;
            // usdDiff is 18-decimal USD value; USDC has 6 decimals
            // USDC is $1, so usdcAmount in 6 decimals = usdDiff / 1e12
            amountInTokens = usdDiff / 1e12;
        }
    }
}
