// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRebalanceStrategy {
    function shouldRebalance(
        uint256 ethValueUsd,
        uint256 usdcValueUsd,
        uint256 targetBps,
        uint256 lastRebalanceBlock
    ) external view returns (bool);

    function calculateSwap(
        uint256 ethValueUsd,
        uint256 usdcValueUsd,
        uint256 targetBps,
        uint256 ethPrice,
        uint8 priceDecimals
    ) external view returns (bool sellEth, uint256 amount);

    function name() external pure returns (string memory);
}