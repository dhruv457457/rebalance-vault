// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AppStorage, appStorage} from "../storage/AppStorage.sol";
import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";
import {PortfolioMath} from "../libraries/PortfolioMath.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract GuardFacet {
    event CircuitBreakerTripped(uint256 blockNumber, string reason);
    event CircuitBreakerReset(uint256 blockNumber);
    event RateLimitHit(uint256 blockNumber, uint256 rebalancesInWindow);
    event VolatilityDetected(uint256 blockNumber, uint256 priceChangeBps);

    function isRebalanceSafe(uint256 swapAmountUsd) external returns (bool) {
        AppStorage storage s = appStorage();

        if (s.circuitBreakerTripped) return false;

        if (!_checkVolatility(s)) return false;

        if (!_checkRateLimit(s)) return false;

        if (!_checkSwapSize(s, swapAmountUsd)) return false;

        return true;
    }

    function tripCircuitBreaker(string calldata reason) external {
        LibDiamond.enforceIsContractOwner();
        AppStorage storage s = appStorage();
        s.circuitBreakerTripped = true;
        emit CircuitBreakerTripped(block.number, reason);
    }

    function resetCircuitBreaker() external {
        LibDiamond.enforceIsContractOwner();
        AppStorage storage s = appStorage();
        s.circuitBreakerTripped = false;

        (uint256 price,) = _getEthPrice(s);
        s.lastKnownPrice = price;

        s.rebalancesInWindow = 0;
        s.windowStartBlock = block.number;

        emit CircuitBreakerReset(block.number);
    }

    function setGuardParams(
        uint256 _maxPriceChangeBps,
        uint256 _maxRebalancesPerWindow,
        uint256 _windowSizeBlocks,
        uint256 _maxSwapSizeBps
    ) external {
        LibDiamond.enforceIsContractOwner();
        AppStorage storage s = appStorage();

        s.maxPriceChangeBps = _maxPriceChangeBps;
        s.maxRebalancesPerWindow = _maxRebalancesPerWindow;
        s.windowSizeBlocks = _windowSizeBlocks;
        s.maxSwapSizeBps = _maxSwapSizeBps;
    }

    function initializeGuard(uint256 currentPrice) external {
        LibDiamond.enforceIsContractOwner();
        AppStorage storage s = appStorage();
        s.lastKnownPrice = currentPrice;
        s.windowStartBlock = block.number;
    }

    function recordRebalance() external {
        AppStorage storage s = appStorage();
        _updateRateLimit(s);
    }

    function _checkVolatility(AppStorage storage s) internal returns (bool) {
        if (s.maxPriceChangeBps == 0) return true;
        if (s.lastKnownPrice == 0) return true;

        (uint256 currentPrice,) = _getEthPrice(s);

        uint256 priceDiff;
        if (currentPrice > s.lastKnownPrice) {
            priceDiff = currentPrice - s.lastKnownPrice;
        } else {
            priceDiff = s.lastKnownPrice - currentPrice;
        }

        uint256 changeBps = (priceDiff * 10_000) / s.lastKnownPrice;

        s.lastKnownPrice = currentPrice;

        if (changeBps > s.maxPriceChangeBps) {
            s.circuitBreakerTripped = true;
            emit VolatilityDetected(block.number, changeBps);
            emit CircuitBreakerTripped(block.number, "Volatility threshold exceeded");
            return false;
        }

        return true;
    }

    function _checkRateLimit(AppStorage storage s) internal returns (bool) {
        if (s.maxRebalancesPerWindow == 0) return true;

        if (block.number > s.windowStartBlock + s.windowSizeBlocks) {
            s.windowStartBlock = block.number;
            s.rebalancesInWindow = 0;
        }

        if (s.rebalancesInWindow >= s.maxRebalancesPerWindow) {
            emit RateLimitHit(block.number, s.rebalancesInWindow);
            return false;
        }

        return true;
    }

    function _updateRateLimit(AppStorage storage s) internal {
        if (s.maxRebalancesPerWindow == 0) return;

        if (block.number > s.windowStartBlock + s.windowSizeBlocks) {
            s.windowStartBlock = block.number;
            s.rebalancesInWindow = 1;
        } else {
            s.rebalancesInWindow++;
        }
    }

    function _checkSwapSize(
        AppStorage storage s,
        uint256 swapAmountUsd
    ) internal view returns (bool) {
        if (s.maxSwapSizeBps == 0) return true;

        uint256 ethBalance = address(this).balance;
        uint256 usdcBalance;

        try this.getUsdcBalance() returns (uint256 bal) {
            usdcBalance = bal;
        } catch {
            return true;
        }

        (uint256 ethPrice, uint8 decimals) = _getEthPrice(s);
        uint256 ethValueUsd = PortfolioMath.calculateValueUsd(ethBalance, ethPrice, 18, decimals);
        uint256 usdcValueUsd = PortfolioMath.calculateValueUsd(usdcBalance, 1e8, 6, 8);
        uint256 totalUsd = ethValueUsd + usdcValueUsd;

        if (totalUsd == 0) return true;

        uint256 maxSwapUsd = (totalUsd * s.maxSwapSizeBps) / 10_000;
        return swapAmountUsd <= maxSwapUsd;
    }

    function getUsdcBalance() external view returns (uint256) {
        AppStorage storage s = appStorage();
        (bool success, bytes memory data) = s.usdc.staticcall(
            abi.encodeWithSignature("balanceOf(address)", address(this))
        );
        require(success, "GuardFacet: balanceOf failed");
        return abi.decode(data, (uint256));
    }

    function _getEthPrice(AppStorage storage s)
        internal
        view
        returns (uint256 price, uint8 decimals)
    {
        AggregatorV3Interface feed = AggregatorV3Interface(s.priceFeed);
        decimals = feed.decimals();
        (, int256 answer,,,) = feed.latestRoundData();
        require(answer > 0, "GuardFacet: Invalid price");
        price = uint256(answer);
    }
}