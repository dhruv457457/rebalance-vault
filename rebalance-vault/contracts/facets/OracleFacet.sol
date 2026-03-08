// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AppStorage, appStorage} from "../storage/AppStorage.sol";
import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";
import {PortfolioMath} from "../libraries/PortfolioMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OracleFacet {
    uint256 constant STALENESS_THRESHOLD = 3600;

    function getEthPrice() public view returns (uint256 price, uint8 decimals) {
        AppStorage storage s = appStorage();
        AggregatorV3Interface feed = AggregatorV3Interface(s.priceFeed);
        decimals = feed.decimals();

        (, int256 answer,, uint256 updatedAt,) = feed.latestRoundData();
        require(answer > 0, "OracleFacet: Invalid price");
        require(block.timestamp - updatedAt <= STALENESS_THRESHOLD, "OracleFacet: Stale price");

        price = uint256(answer);
    }

    function getPortfolioValue()
        public
        view
        returns (uint256 ethValueUsd, uint256 usdcValueUsd, uint256 totalUsd)
    {
        AppStorage storage s = appStorage();

        uint256 ethBalance = address(this).balance;
        uint256 usdcBalance = IERC20(s.usdc).balanceOf(address(this));

        (uint256 ethPrice, uint8 ethDecimals) = getEthPrice();

        ethValueUsd = PortfolioMath.calculateValueUsd(ethBalance, ethPrice, 18, ethDecimals);
        usdcValueUsd = PortfolioMath.calculateValueUsd(usdcBalance, 1e8, 6, 8);
        totalUsd = ethValueUsd + usdcValueUsd;
    }

    function getCurrentDrift() public view returns (int256) {
        AppStorage storage s = appStorage();
        (uint256 ethValueUsd,, uint256 totalUsd) = getPortfolioValue();

        if (totalUsd == 0) return int256(0);

        uint256 currentEthBps = PortfolioMath.calculateAllocationBps(ethValueUsd, totalUsd);
        return PortfolioMath.calculateDrift(currentEthBps, s.targetAllocationBps);
    }

    function isPriceStale() external view returns (bool) {
        AppStorage storage s = appStorage();
        AggregatorV3Interface feed = AggregatorV3Interface(s.priceFeed);
        (,,, uint256 updatedAt,) = feed.latestRoundData();
        return (block.timestamp - updatedAt > STALENESS_THRESHOLD);
    }
}