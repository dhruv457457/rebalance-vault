// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// ─────────────────────────────────────────────────────────────────────────────
// MockERC20 — configurable decimals ERC20 for testing
// ─────────────────────────────────────────────────────────────────────────────
contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MockWETH — wrap/unwrap ETH for testing
// ─────────────────────────────────────────────────────────────────────────────
contract MockWETH is ERC20 {
    constructor() ERC20("Wrapped Ether", "WETH") {}

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    receive() external payable {
        _mint(msg.sender, msg.value);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MockAggregator — Chainlink price feed mock
// ─────────────────────────────────────────────────────────────────────────────
contract MockAggregator {
    int256 public price;
    uint8 public decimals;
    uint256 public updatedAt;
    uint80 public roundId;

    constructor(int256 _price, uint8 _decimals) {
        price = _price;
        decimals = _decimals;
        updatedAt = block.timestamp;
        roundId = 1;
    }

    function setPrice(int256 _price) external {
        price = _price;
        updatedAt = block.timestamp;
        roundId++;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId_,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt_,
            uint80 answeredInRound
        )
    {
        return (roundId, price, updatedAt, updatedAt, roundId);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MockSwapRouter — Uniswap V3 router mock
// Returns tokens at 1:1 USD ratio based on a fixed price
// ─────────────────────────────────────────────────────────────────────────────
contract MockSwapRouter {
    address public usdc;
    address public weth;

    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    constructor(address _usdc, address _weth) {
        usdc = _usdc;
        weth = _weth;
    }

    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable returns (uint256 amountOut) {
        // Pull tokenIn from caller
        _pullToken(params.tokenIn, msg.sender, params.amountIn);

        // Calculate output at simplified $2000/ETH rate
        if (params.tokenIn == weth && params.tokenOut == usdc) {
            // WETH → USDC: 1 ETH = 2000 USDC
            amountOut = (params.amountIn * 2000) / 1e12; // scale 18→6 decimals
        } else if (params.tokenIn == usdc && params.tokenOut == weth) {
            // USDC → WETH: 1 USDC = 1/2000 ETH
            amountOut = (params.amountIn * 1e12) / 2000; // scale 6→18 decimals
        } else {
            amountOut = params.amountIn;
        }

        require(amountOut >= params.amountOutMinimum, "Too little received");

        // Send tokenOut to recipient
        _mintToken(params.tokenOut, params.recipient, amountOut);
    }

    function _pullToken(address token, address from, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                from,
                address(this),
                amount
            )
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Pull failed");
    }

    function _mintToken(address token, address to, uint256 amount) internal {
        (bool success, ) = token.call(
            abi.encodeWithSignature("mint(address,uint256)", to, amount)
        );
        require(success, "Mint failed");
    }

    receive() external payable {}
}
