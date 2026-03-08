// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AppStorage, appStorage} from "../storage/AppStorage.sol";
import {IYieldAdapter} from "../interfaces/IYieldAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract YieldFacet {
    using SafeERC20 for IERC20;

    event DepositedToYield(uint256 amount, uint256 totalDeposited);
    event WithdrawnFromYield(uint256 amount, uint256 totalDeposited);
    event YieldHarvested(uint256 yieldAmount, uint256 totalYieldEarned);
    event YieldToggled(bool enabled);

    function setYieldEnabled(bool _enabled) external {
        LibDiamond.enforceIsContractOwner();
        AppStorage storage s = appStorage();
        s.yieldEnabled = _enabled;
        emit YieldToggled(_enabled);
    }

    function setYieldAdapter(address _adapter) external {
        LibDiamond.enforceIsContractOwner();
        AppStorage storage s = appStorage();
        s.yieldAdapter = _adapter;
    }

    function depositToYield(uint256 amount) external {
        AppStorage storage s = appStorage();
        require(s.yieldEnabled, "YieldFacet: Yield disabled");
        require(s.yieldAdapter != address(0), "YieldFacet: No adapter");
        require(amount > 0, "YieldFacet: Zero amount");

        uint256 usdcBalance = IERC20(s.usdc).balanceOf(address(this));
        require(usdcBalance >= amount, "YieldFacet: Insufficient USDC");

        IERC20(s.usdc).forceApprove(s.yieldAdapter, amount);
        IYieldAdapter(s.yieldAdapter).deposit(s.usdc, amount);

        s.totalDepositedToAave += amount;

        emit DepositedToYield(amount, s.totalDepositedToAave);
    }

    function withdrawFromYield(uint256 amount) external {
        AppStorage storage s = appStorage();
        require(s.yieldAdapter != address(0), "YieldFacet: No adapter");
        require(amount > 0, "YieldFacet: Zero amount");

        IYieldAdapter(s.yieldAdapter).withdraw(s.usdc, amount);

        if (amount <= s.totalDepositedToAave) {
            s.totalDepositedToAave -= amount;
        } else {
            s.totalDepositedToAave = 0;
        }

        emit WithdrawnFromYield(amount, s.totalDepositedToAave);
    }

    function harvestYield() external {
        AppStorage storage s = appStorage();
        require(s.yieldAdapter != address(0), "YieldFacet: No adapter");

        uint256 yieldEarned = IYieldAdapter(s.yieldAdapter).getYieldEarned(
            s.usdc,
            s.totalDepositedToAave
        );

        if (yieldEarned > 0) {
            s.totalYieldEarned += yieldEarned;
            emit YieldHarvested(yieldEarned, s.totalYieldEarned);
        }
    }

    function getYieldBalance() external view returns (uint256) {
        AppStorage storage s = appStorage();
        if (s.yieldAdapter == address(0)) return 0;
        return IYieldAdapter(s.yieldAdapter).getBalance(s.usdc);
    }
}