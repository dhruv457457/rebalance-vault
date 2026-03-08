// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AppStorage, appStorage} from "../storage/AppStorage.sol";
import {IRebalanceStrategy} from "../strategies/IRebalanceStrategy.sol";
import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";
import {IWETH} from "../interfaces/IWETH.sol";
import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";
import {PortfolioMath} from "../libraries/PortfolioMath.sol";
import {SwapMath} from "../libraries/SwapMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract RebalanceFacet {
    using SafeERC20 for IERC20;

    event Rebalanced(
        uint256 indexed blockNumber,
        bool soldEth,
        uint256 swapAmount,
        uint256 amountOut,
        int256 driftBefore,
        int256 driftAfter
    );

    modifier whenNotPaused() {
        require(!appStorage().paused, "RebalanceFacet: Paused");
        _;
    }

    function checkUpkeep(bytes calldata)
        external
        view
        returns (bool upkeepNeeded, bytes memory performData)
    {
        AppStorage storage s = appStorage();

        if (s.paused) return (false, "");
        if (s.totalShares == 0) return (false, "");
        if (s.activeStrategy == address(0)) return (false, "");
        if (block.number < s.lastRebalanceBlock + s.minRebalanceInterval) return (false, "");

        (uint256 ethValueUsd, uint256 usdcValueUsd,) = _getPortfolioValue(s);

        upkeepNeeded = IRebalanceStrategy(s.activeStrategy).shouldRebalance(
            ethValueUsd,
            usdcValueUsd,
            s.targetAllocationBps,
            s.lastRebalanceBlock
        );

        performData = "";
    }

    function performUpkeep(bytes calldata) external whenNotPaused {
        AppStorage storage s = appStorage();
        uint256 gasStart = gasleft();

        require(s.totalShares > 0, "RebalanceFacet: No deposits");
        require(s.activeStrategy != address(0), "RebalanceFacet: No strategy");
        require(s.swapAdapter != address(0), "RebalanceFacet: No swap adapter");
        require(
            block.number >= s.lastRebalanceBlock + s.minRebalanceInterval,
            "RebalanceFacet: Too soon"
        );

        (uint256 ethValueUsd, uint256 usdcValueUsd,) = _getPortfolioValue(s);
        (uint256 ethPrice, uint8 priceDecimals) = _getEthPrice(s);

        int256 driftBefore = _calculateDrift(ethValueUsd, usdcValueUsd, s.targetAllocationBps);

        (bool sellEth, uint256 swapAmount) = IRebalanceStrategy(s.activeStrategy).calculateSwap(
            ethValueUsd,
            usdcValueUsd,
            s.targetAllocationBps,
            ethPrice,
            priceDecimals
        );

        require(swapAmount > 0, "RebalanceFacet: Nothing to swap");

        uint256 amountOut;

        if (sellEth) {
            amountOut = _sellEthForUsdc(s, swapAmount, ethPrice, priceDecimals);
        } else {
            amountOut = _sellUsdcForEth(s, swapAmount, ethPrice, priceDecimals);
        }

        s.rebalanceCount++;
        s.lastRebalanceBlock = block.number;
        s.lastRebalancePrice = ethPrice;
        s.totalVolumeSwapped += swapAmount;

        (uint256 newEthValue, uint256 newUsdcValue,) = _getPortfolioValue(s);
        int256 driftAfter = _calculateDrift(newEthValue, newUsdcValue, s.targetAllocationBps);

        uint256 gasUsed = gasStart - gasleft();
        s.totalGasUsed += gasUsed;

        emit Rebalanced(block.number, sellEth, swapAmount, amountOut, driftBefore, driftAfter);
    }

    function _sellEthForUsdc(
        AppStorage storage s,
        uint256 ethAmount,
        uint256 ethPrice,
        uint8 priceDecimals
    ) internal returns (uint256 usdcReceived) {
        IWETH weth = IWETH(s.weth);
        weth.deposit{value: ethAmount}();

        uint256 expectedUsdc = SwapMath.calculateExpectedUsdcOut(ethAmount, ethPrice, priceDecimals);
        uint256 minOut = SwapMath.calculateMinOutput(expectedUsdc, s.maxSlippageBps);

        IERC20(s.weth).forceApprove(s.swapAdapter, ethAmount);

        usdcReceived = ISwapAdapter(s.swapAdapter).swap(
            s.weth,
            s.usdc,
            ethAmount,
            minOut,
            address(this)
        );

        if (expectedUsdc > usdcReceived) {
            s.totalSlippageLost += (expectedUsdc - usdcReceived);
        }
    }

    function _sellUsdcForEth(
        AppStorage storage s,
        uint256 usdcAmount,
        uint256 ethPrice,
        uint8 priceDecimals
    ) internal returns (uint256 ethReceived) {
        uint256 expectedWeth = SwapMath.calculateExpectedWethOut(usdcAmount, ethPrice, priceDecimals);
        uint256 minOut = SwapMath.calculateMinOutput(expectedWeth, s.maxSlippageBps);

        IERC20(s.usdc).forceApprove(s.swapAdapter, usdcAmount);

        uint256 wethReceived = ISwapAdapter(s.swapAdapter).swap(
            s.usdc,
            s.weth,
            usdcAmount,
            minOut,
            address(this)
        );

        IWETH(s.weth).withdraw(wethReceived);
        ethReceived = wethReceived;

        if (expectedWeth > wethReceived) {
            s.totalSlippageLost += (expectedWeth - wethReceived);
        }
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
        require(answer > 0, "RebalanceFacet: Invalid price");
        price = uint256(answer);
    }

    function _calculateDrift(
        uint256 ethValueUsd,
        uint256 usdcValueUsd,
        uint256 targetBps
    ) internal pure returns (int256) {
        uint256 totalUsd = ethValueUsd + usdcValueUsd;
        if (totalUsd == 0) return int256(0);
        uint256 currentBps = PortfolioMath.calculateAllocationBps(ethValueUsd, totalUsd);
        return PortfolioMath.calculateDrift(currentBps, targetBps);
    }
}
