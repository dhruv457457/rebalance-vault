// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AppStorage, appStorage} from "../storage/AppStorage.sol";
import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";
import {PortfolioMath} from "../libraries/PortfolioMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract FeeFacet {
    using SafeERC20 for IERC20;

    uint256 constant SECONDS_PER_YEAR = 365 days;

    event ManagementFeeAccrued(uint256 feeUsd, uint256 timestamp);
    event PerformanceFeeAccrued(uint256 feeUsd, uint256 newHighWaterMark);
    event FeesClaimed(address indexed recipient, uint256 usdcAmount);
    event FeeParamsUpdated(uint256 managementFeeBps, uint256 performanceFeeBps, address feeRecipient);

    function setFeeParams(
        uint256 _managementFeeBps,
        uint256 _performanceFeeBps,
        address _feeRecipient
    ) external {
        LibDiamond.enforceIsContractOwner();
        AppStorage storage s = appStorage();

        require(_managementFeeBps <= 1000, "FeeFacet: Management fee too high");
        require(_performanceFeeBps <= 5000, "FeeFacet: Performance fee too high");
        require(_feeRecipient != address(0), "FeeFacet: Zero address");

        s.managementFeeBps = _managementFeeBps;
        s.performanceFeeBps = _performanceFeeBps;
        s.feeRecipient = _feeRecipient;

        if (s.lastFeeTimestamp == 0) {
            s.lastFeeTimestamp = block.timestamp;
        }

        emit FeeParamsUpdated(_managementFeeBps, _performanceFeeBps, _feeRecipient);
    }

    function accrueManagementFee() external {
        _accrueManagementFee();
    }

    function accruePerformanceFee() external {
        _accruePerformanceFee();
    }

    function claimFees() external {
        AppStorage storage s = appStorage();
        require(msg.sender == s.feeRecipient, "FeeFacet: Not fee recipient");
        require(s.accruedFees > 0, "FeeFacet: No fees to claim");

        uint256 feesToClaim = s.accruedFees;
        uint256 usdcBalance = IERC20(s.usdc).balanceOf(address(this));

        uint256 usdcToSend = feesToClaim / 1e12;
        if (usdcToSend > usdcBalance) {
            usdcToSend = usdcBalance;
        }

        s.accruedFees = 0;

        if (usdcToSend > 0) {
            IERC20(s.usdc).safeTransfer(s.feeRecipient, usdcToSend);
        }

        emit FeesClaimed(s.feeRecipient, usdcToSend);
    }

    function _accrueManagementFee() internal {
        AppStorage storage s = appStorage();

        if (s.managementFeeBps == 0) return;
        if (s.lastFeeTimestamp == 0) {
            s.lastFeeTimestamp = block.timestamp;
            return;
        }
        if (s.totalShares == 0) return;

        uint256 elapsed = block.timestamp - s.lastFeeTimestamp;
        if (elapsed == 0) return;

        uint256 totalUsd = _getTotalValueUsd(s);
        if (totalUsd == 0) return;

        uint256 annualFee = (totalUsd * s.managementFeeBps) / 10_000;
        uint256 fee = (annualFee * elapsed) / SECONDS_PER_YEAR;

        s.accruedFees += fee;
        s.lastFeeTimestamp = block.timestamp;

        emit ManagementFeeAccrued(fee, block.timestamp);
    }

    function _accruePerformanceFee() internal {
        AppStorage storage s = appStorage();

        if (s.performanceFeeBps == 0) return;
        if (s.totalShares == 0) return;

        uint256 totalUsd = _getTotalValueUsd(s);
        uint256 currentSharePrice = (totalUsd * 1e18) / s.totalShares;

        if (s.highWaterMark == 0) {
            s.highWaterMark = currentSharePrice;
            return;
        }

        if (currentSharePrice <= s.highWaterMark) return;

        uint256 profit = currentSharePrice - s.highWaterMark;
        uint256 profitTotal = (profit * s.totalShares) / 1e18;
        uint256 fee = (profitTotal * s.performanceFeeBps) / 10_000;

        s.accruedFees += fee;
        s.highWaterMark = currentSharePrice;

        emit PerformanceFeeAccrued(fee, currentSharePrice);
    }

    function _getTotalValueUsd(AppStorage storage s) internal view returns (uint256) {
        uint256 ethBalance = address(this).balance;
        uint256 usdcBalance = IERC20(s.usdc).balanceOf(address(this));

        (uint256 ethPrice, uint8 decimals) = _getEthPrice(s);

        uint256 ethValueUsd = PortfolioMath.calculateValueUsd(ethBalance, ethPrice, 18, decimals);
        uint256 usdcValueUsd = PortfolioMath.calculateValueUsd(usdcBalance, 1e8, 6, 8);

        return ethValueUsd + usdcValueUsd;
    }

    function _getEthPrice(AppStorage storage s)
        internal
        view
        returns (uint256 price, uint8 decimals)
    {
        AggregatorV3Interface feed = AggregatorV3Interface(s.priceFeed);
        decimals = feed.decimals();
        (, int256 answer,,,) = feed.latestRoundData();
        require(answer > 0, "FeeFacet: Invalid price");
        price = uint256(answer);
    }
}