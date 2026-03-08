// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AppStorage, appStorage} from "../storage/AppStorage.sol";
import {IRebalanceStrategy} from "../strategies/IRebalanceStrategy.sol";
import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";
import {PortfolioMath} from "../libraries/PortfolioMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract StrategyFacet {
    event StrategyUpdated(address indexed oldStrategy, address indexed newStrategy);

    function setActiveStrategy(address _strategy) external {
        LibDiamond.enforceIsContractOwner();
        AppStorage storage s = appStorage();
        require(_strategy != address(0), "StrategyFacet: Zero address");

        address oldStrategy = s.activeStrategy;
        s.activeStrategy = _strategy;

        emit StrategyUpdated(oldStrategy, _strategy);
    }

    function shouldRebalance() external view returns (bool) {
        AppStorage storage s = appStorage();
        require(s.activeStrategy != address(0), "StrategyFacet: No strategy set");

        (uint256 ethValueUsd, uint256 usdcValueUsd,) = _getPortfolioValue(s);

        return IRebalanceStrategy(s.activeStrategy).shouldRebalance(
            ethValueUsd,
            usdcValueUsd,
            s.targetAllocationBps,
            s.lastRebalanceBlock
        );
    }

    function getSwapParams()
        external
        view
        returns (bool sellEth, uint256 amount)
    {
        AppStorage storage s = appStorage();
        require(s.activeStrategy != address(0), "StrategyFacet: No strategy set");

        (uint256 ethValueUsd, uint256 usdcValueUsd,) = _getPortfolioValue(s);
        (uint256 ethPrice, uint8 decimals) = _getEthPrice(s);

        return IRebalanceStrategy(s.activeStrategy).calculateSwap(
            ethValueUsd, usdcValueUsd, s.targetAllocationBps, ethPrice, decimals
        );
    }

    function getActiveStrategy() external view returns (address, string memory) {
        AppStorage storage s = appStorage();
        if (s.activeStrategy == address(0)) return (address(0), "None");
        return (s.activeStrategy, IRebalanceStrategy(s.activeStrategy).name());
    }

    function _getPortfolioValue(AppStorage storage s)
        internal
        view
        returns (uint256 ethValueUsd, uint256 usdcValueUsd, uint256 totalUsd)
    {
        uint256 ethBalance = address(this).balance;
        uint256 usdcBalance = IERC20(s.usdc).balanceOf(address(this));

        (uint256 ethPrice, uint8 decimals) = _getEthPrice(s);

        ethValueUsd = PortfolioMath.calculateValueUsd(ethBalance, ethPrice, 18, decimals);
        usdcValueUsd = PortfolioMath.calculateValueUsd(usdcBalance, 1e8, 6, 8);
        totalUsd = ethValueUsd + usdcValueUsd;
    }

    function _getEthPrice(AppStorage storage s)
        internal
        view
        returns (uint256 price, uint8 decimals)
    {
        AggregatorV3Interface feed = AggregatorV3Interface(s.priceFeed);
        decimals = feed.decimals();
        (, int256 answer,,,) = feed.latestRoundData();
        require(answer > 0, "StrategyFacet: Invalid price");
        price = uint256(answer);
    }
}