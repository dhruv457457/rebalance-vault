// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AppStorage, appStorage} from "../storage/AppStorage.sol";
import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";
import {PortfolioMath} from "../libraries/PortfolioMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract VaultFacet {
    using SafeERC20 for IERC20;

    event Deposited(address indexed user, uint256 ethAmount, uint256 usdcAmount, uint256 sharesIssued);
    event Withdrawn(address indexed user, uint256 ethAmount, uint256 usdcAmount, uint256 sharesBurned);

    modifier whenNotPaused() {
        require(!appStorage().paused, "VaultFacet: Paused");
        _;
    }

    function deposit() external payable whenNotPaused {
        require(msg.value > 0, "VaultFacet: Zero deposit");
        AppStorage storage s = appStorage();

        uint256 sharesToMint;

        if (s.totalShares == 0) {
            sharesToMint = msg.value;
        } else {
            (uint256 ethPrice, uint8 decimals) = _getEthPrice(s);
            uint256 depositValueUsd = PortfolioMath.calculateValueUsd(msg.value, ethPrice, 18, decimals);
            uint256 totalValueUsd = _getTotalValueUsd(s, ethPrice, decimals);
            uint256 totalValueBefore = totalValueUsd - depositValueUsd;

            if (totalValueBefore == 0) {
                sharesToMint = msg.value;
            } else {
                sharesToMint = (depositValueUsd * s.totalShares) / totalValueBefore;
            }
        }

        s.shares[msg.sender] += sharesToMint;
        s.totalShares += sharesToMint;

        emit Deposited(msg.sender, msg.value, 0, sharesToMint);
    }

    function depositUSDC(uint256 amount) external whenNotPaused {
        require(amount > 0, "VaultFacet: Zero deposit");
        AppStorage storage s = appStorage();

        IERC20(s.usdc).safeTransferFrom(msg.sender, address(this), amount);

        uint256 sharesToMint;

        if (s.totalShares == 0) {
            sharesToMint = amount * 1e12;
        } else {
            uint256 depositValueUsd = PortfolioMath.calculateValueUsd(amount, 1e8, 6, 8);
            (uint256 ethPrice, uint8 decimals) = _getEthPrice(s);
            uint256 totalValueUsd = _getTotalValueUsd(s, ethPrice, decimals);
            uint256 totalValueBefore = totalValueUsd - depositValueUsd;

            if (totalValueBefore == 0) {
                sharesToMint = amount * 1e12;
            } else {
                sharesToMint = (depositValueUsd * s.totalShares) / totalValueBefore;
            }
        }

        s.shares[msg.sender] += sharesToMint;
        s.totalShares += sharesToMint;

        emit Deposited(msg.sender, 0, amount, sharesToMint);
    }

    function withdraw(uint256 shareAmount) external {
        AppStorage storage s = appStorage();
        require(shareAmount > 0, "VaultFacet: Zero shares");
        require(s.shares[msg.sender] >= shareAmount, "VaultFacet: Insufficient shares");

        uint256 ethAmount = (address(this).balance * shareAmount) / s.totalShares;
        uint256 usdcAmount = (IERC20(s.usdc).balanceOf(address(this)) * shareAmount) / s.totalShares;

        s.shares[msg.sender] -= shareAmount;
        s.totalShares -= shareAmount;

        if (ethAmount > 0) {
            (bool success,) = payable(msg.sender).call{value: ethAmount}("");
            require(success, "VaultFacet: ETH transfer failed");
        }

        if (usdcAmount > 0) {
            IERC20(s.usdc).safeTransfer(msg.sender, usdcAmount);
        }

        emit Withdrawn(msg.sender, ethAmount, usdcAmount, shareAmount);
    }

    function emergencyWithdraw() external {
        AppStorage storage s = appStorage();
        uint256 shareAmount = s.shares[msg.sender];
        require(shareAmount > 0, "VaultFacet: No shares");

        uint256 ethAmount = (address(this).balance * shareAmount) / s.totalShares;
        uint256 usdcAmount = (IERC20(s.usdc).balanceOf(address(this)) * shareAmount) / s.totalShares;

        s.shares[msg.sender] = 0;
        s.totalShares -= shareAmount;

        if (ethAmount > 0) {
            (bool success,) = payable(msg.sender).call{value: ethAmount}("");
            require(success, "VaultFacet: ETH transfer failed");
        }

        if (usdcAmount > 0) {
            IERC20(s.usdc).safeTransfer(msg.sender, usdcAmount);
        }

        emit Withdrawn(msg.sender, ethAmount, usdcAmount, shareAmount);
    }

    function _getEthPrice(AppStorage storage s) internal view returns (uint256 price, uint8 decimals) {
        AggregatorV3Interface feed = AggregatorV3Interface(s.priceFeed);
        decimals = feed.decimals();
        (, int256 answer,,,) = feed.latestRoundData();
        require(answer > 0, "VaultFacet: Invalid price");
        price = uint256(answer);
    }

    function _getTotalValueUsd(
        AppStorage storage s,
        uint256 ethPrice,
        uint8 ethDecimals
    ) internal view returns (uint256) {
        uint256 ethBalance = address(this).balance;
        uint256 usdcBalance = IERC20(s.usdc).balanceOf(address(this));

        uint256 ethValueUsd = PortfolioMath.calculateValueUsd(ethBalance, ethPrice, 18, ethDecimals);
        uint256 usdcValueUsd = PortfolioMath.calculateValueUsd(usdcBalance, 1e8, 6, 8);

        return ethValueUsd + usdcValueUsd;
    }
}