// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IYieldAdapter} from "../interfaces/IYieldAdapter.sol";
import {IAavePool} from "../interfaces/IAavePool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AaveYieldAdapter is IYieldAdapter {
    using SafeERC20 for IERC20;

    IAavePool public immutable aavePool;
    mapping(address => address) public aTokens;

    constructor(address _aavePool) {
        aavePool = IAavePool(_aavePool);
    }

    function setAToken(address underlying, address aToken) external {
        aTokens[underlying] = aToken;
    }

    function deposit(address token, uint256 amount)
        external
        override
        returns (uint256 sharesReceived)
    {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(token).forceApprove(address(aavePool), amount);

        uint256 aTokenBefore = 0;
        address aToken = aTokens[token];
        if (aToken != address(0)) {
            aTokenBefore = IERC20(aToken).balanceOf(address(this));
        }

        aavePool.supply(token, amount, address(this), 0);

        if (aToken != address(0)) {
            sharesReceived = IERC20(aToken).balanceOf(address(this)) - aTokenBefore;
        } else {
            sharesReceived = amount;
        }
    }

    function withdraw(address token, uint256 amount)
        external
        override
        returns (uint256 tokensReceived)
    {
        tokensReceived = aavePool.withdraw(token, amount, msg.sender);
    }

    function getBalance(address token) external view override returns (uint256) {
        address aToken = aTokens[token];
        if (aToken == address(0)) return 0;
        return IERC20(aToken).balanceOf(address(this));
    }

    function getYieldEarned(address token, uint256 totalDeposited)
        external
        view
        override
        returns (uint256)
    {
        address aToken = aTokens[token];
        if (aToken == address(0)) return 0;

        uint256 currentBalance = IERC20(aToken).balanceOf(address(this));
        if (currentBalance <= totalDeposited) return 0;
        return currentBalance - totalDeposited;
    }

    function name() external pure override returns (string memory) {
        return "AaveYieldAdapter";
    }
}