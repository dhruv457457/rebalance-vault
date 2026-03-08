// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";
import {ISwapRouter} from "../interfaces/ISwapRouter.sol";
import {IWETH} from "../interfaces/IWETH.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract UniswapV3Adapter is ISwapAdapter {
    using SafeERC20 for IERC20;

    ISwapRouter public immutable router;
    address public immutable weth;
    uint24 public constant POOL_FEE = 3000;

    constructor(address _router, address _weth) {
        router = ISwapRouter(_router);
        weth = _weth;
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external override returns (uint256 amountOut) {
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).forceApprove(address(router), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: POOL_FEE,
            recipient: recipient,
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });

        amountOut = router.exactInputSingle(params);
    }

    function getExpectedOutput(
        address,
        address,
        uint256 amountIn
    ) external pure override returns (uint256) {
        return amountIn;
    }

    function name() external pure override returns (string memory) {
        return "UniswapV3Adapter";
    }
}