// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {PortfolioMath} from "./libraries/PortfolioMath.sol";
import {ISwapRouter} from "./interfaces/ISwapRouter.sol";

/// @dev Minimal WETH interface for wrap/unwrap operations
interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @title RebalanceVault
/// @author RebalanceVault Team
/// @notice An on-chain portfolio rebalancer that maintains a target ETH/USDC allocation
///         using Chainlink price feeds, Chainlink Automation, and Uniswap V3 swaps.
/// @dev Inherits ReentrancyGuard, Ownable, Pausable, and AutomationCompatibleInterface.
///      Designed for deployment on a contract.dev Stagenet replaying Ethereum mainnet.
contract RebalanceVault is
    ReentrancyGuard,
    Ownable,
    Pausable,
    AutomationCompatibleInterface
{
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────────

    /// @notice Uniswap V3 pool fee tier (0.3%)
    uint24 public constant POOL_FEE = 3000;

    /// @notice Basis points denominator (10000 = 100%)
    uint256 public constant BPS_DENOMINATOR = 10_000;

    /// @notice Maximum age of a Chainlink price before it is considered stale (1 hour)
    uint256 public constant MAX_PRICE_AGE = 3600;

    // ─────────────────────────────────────────────────────────────────────────────
    // Immutables
    // ─────────────────────────────────────────────────────────────────────────────

    /// @notice Chainlink ETH/USD price feed
    AggregatorV3Interface public immutable priceFeed;

    /// @notice Uniswap V3 SwapRouter
    ISwapRouter public immutable swapRouter;

    /// @notice USDC token contract
    IERC20 public immutable usdc;

    /// @notice WETH token contract
    IWETH public immutable weth;

    // ─────────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────────

    /// @notice Share balance per user (proportional claim on vault assets)
    mapping(address => uint256) public shares;

    /// @notice Total shares outstanding
    uint256 public totalShares;

    /// @notice Target ETH allocation in BPS (5000 = 50% ETH / 50% USDC)
    uint256 public targetAllocationBps;

    /// @notice Minimum drift in BPS required to trigger a rebalance (500 = 5%)
    uint256 public driftThresholdBps;

    /// @notice Maximum allowed slippage on Uniswap swaps in BPS (100 = 1%)
    uint256 public maxSlippageBps;

    /// @notice Minimum number of blocks between rebalances (default: 10)
    uint256 public minRebalanceInterval;

    /// @notice Total number of rebalances executed
    uint256 public rebalanceCount;

    /// @notice Block number of the last rebalance
    uint256 public lastRebalanceBlock;

    // ─────────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────────

    /// @notice Emitted when a user deposits ETH or USDC into the vault
    event Deposited(
        address indexed user,
        uint256 ethAmount,
        uint256 usdcAmount,
        uint256 sharesIssued
    );

    /// @notice Emitted when a user withdraws their proportional share of vault assets
    event Withdrawn(
        address indexed user,
        uint256 ethAmount,
        uint256 usdcAmount,
        uint256 sharesBurned
    );

    /// @notice Emitted when a rebalance swap is executed
    event Rebalanced(
        uint256 indexed blockNumber,
        bool soldEth,
        uint256 swapAmount,
        int256 driftBefore,
        int256 driftAfter
    );

    /// @notice Emitted when the target ETH allocation is updated
    event TargetAllocationUpdated(uint256 oldBps, uint256 newBps);

    /// @notice Emitted when the drift threshold is updated
    event DriftThresholdUpdated(uint256 oldBps, uint256 newBps);

    /// @notice Emitted when the max slippage setting is updated
    event MaxSlippageUpdated(uint256 oldBps, uint256 newBps);

    // ─────────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────────

    /// @notice Deploys the RebalanceVault with all required external contract addresses
    /// @param _priceFeed Chainlink ETH/USD price feed address
    /// @param _swapRouter Uniswap V3 SwapRouter address
    /// @param _usdc USDC token address
    /// @param _weth WETH token address
    /// @param _targetAllocationBps Target ETH allocation in BPS (e.g. 5000 = 50%)
    /// @param _driftThresholdBps Drift required to trigger rebalance in BPS (e.g. 500 = 5%)
    /// @param _maxSlippageBps Maximum swap slippage in BPS (e.g. 100 = 1%)
    constructor(
        address _priceFeed,
        address _swapRouter,
        address _usdc,
        address _weth,
        uint256 _targetAllocationBps,
        uint256 _driftThresholdBps,
        uint256 _maxSlippageBps
    ) Ownable(msg.sender) {
        require(_priceFeed != address(0), "Invalid price feed");
        require(_swapRouter != address(0), "Invalid swap router");
        require(_usdc != address(0), "Invalid USDC address");
        require(_weth != address(0), "Invalid WETH address");
        require(_targetAllocationBps <= BPS_DENOMINATOR, "Target > 100%");
        require(
            _driftThresholdBps > 0 && _driftThresholdBps <= 5000,
            "Drift threshold out of range"
        );
        require(
            _maxSlippageBps > 0 && _maxSlippageBps <= 1000,
            "Slippage out of range"
        );

        priceFeed = AggregatorV3Interface(_priceFeed);
        swapRouter = ISwapRouter(_swapRouter);
        usdc = IERC20(_usdc);
        weth = IWETH(_weth);

        targetAllocationBps = _targetAllocationBps;
        driftThresholdBps = _driftThresholdBps;
        maxSlippageBps = _maxSlippageBps;
        minRebalanceInterval = 10;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // User Functions
    // ─────────────────────────────────────────────────────────────────────────────

    /// @notice Deposit ETH into the vault and receive proportional shares
    /// @dev Share calculation: first depositor gets shares equal to msg.value (in wei).
    ///      Subsequent depositors receive shares proportional to USD value contributed.
    function deposit() external payable whenNotPaused nonReentrant {
        require(msg.value > 0, "Must deposit non-zero ETH");

        uint256 sharesIssued;

        if (totalShares == 0) {
            // First deposit — seed shares 1:1 with wei deposited
            sharesIssued = msg.value;
        } else {
            // Proportional shares based on USD value deposited vs total portfolio USD
            (uint256 ethPrice, uint8 priceDecimals) = _getEthPrice();
            (, , uint256 totalUsd) = getPortfolioValue();
            require(totalUsd > 0, "Portfolio has no value");

            // ethDepositedUsd: 18-decimal USD value of deposited ETH
            uint256 ethDepositedUsd = PortfolioMath.calculateValueUsd(
                msg.value,
                ethPrice,
                18,
                priceDecimals
            );

            sharesIssued = (ethDepositedUsd * totalShares) / totalUsd;
        }

        require(sharesIssued > 0, "Zero shares issued");
        shares[msg.sender] += sharesIssued;
        totalShares += sharesIssued;

        emit Deposited(msg.sender, msg.value, 0, sharesIssued);
    }

    /// @notice Deposit USDC into the vault and receive proportional shares
    /// @param amount Amount of USDC to deposit (6 decimal precision)
    function depositUSDC(
        uint256 amount
    ) external whenNotPaused nonReentrant {
        require(amount > 0, "Must deposit non-zero USDC");

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        uint256 sharesIssued;

        if (totalShares == 0) {
            // First deposit — treat 1 USDC = 1e12 shares (scale 6 dec to 18 dec)
            sharesIssued = amount * 1e12;
        } else {
            (, , uint256 totalUsd) = getPortfolioValue();
            require(totalUsd > 0, "Portfolio has no value");

            // USDC is $1 — USD value in 18 decimals = amount * 1e12
            uint256 usdcDepositedUsd = amount * 1e12;
            sharesIssued = (usdcDepositedUsd * totalShares) / totalUsd;
        }

        require(sharesIssued > 0, "Zero shares issued");
        shares[msg.sender] += sharesIssued;
        totalShares += sharesIssued;

        emit Deposited(msg.sender, 0, amount, sharesIssued);
    }

    /// @notice Withdraw a proportional share of vault ETH and USDC
    /// @param shareAmount Number of shares to burn and redeem
    function withdraw(uint256 shareAmount) external nonReentrant {
        require(shareAmount > 0, "Must withdraw non-zero shares");
        require(shares[msg.sender] >= shareAmount, "Insufficient shares");
        require(totalShares >= shareAmount, "Share underflow");

        uint256 ethBalance = address(this).balance;
        uint256 usdcBalance = usdc.balanceOf(address(this));

        // Proportional claim on each asset
        uint256 ethAmount = (ethBalance * shareAmount) / totalShares;
        uint256 usdcAmount = (usdcBalance * shareAmount) / totalShares;

        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;

        emit Withdrawn(msg.sender, ethAmount, usdcAmount, shareAmount);

        if (usdcAmount > 0) {
            usdc.safeTransfer(msg.sender, usdcAmount);
        }
        if (ethAmount > 0) {
            (bool success, ) = payable(msg.sender).call{value: ethAmount}("");
            require(success, "ETH transfer failed");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Chainlink Automation
    // ─────────────────────────────────────────────────────────────────────────────

    /// @notice Called by Chainlink Automation nodes every block to determine if rebalancing is needed
    /// @return upkeepNeeded True if a rebalance should be executed
    /// @return performData Empty bytes (no additional data needed for performUpkeep)
    function checkUpkeep(
        bytes calldata
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        if (paused()) return (false, "");
        if (totalShares == 0) return (false, "");
        if (block.number < lastRebalanceBlock + minRebalanceInterval)
            return (false, "");

        int256 drift = getCurrentDrift();
        uint256 absDrift = drift >= 0 ? uint256(drift) : uint256(-drift);

        upkeepNeeded = absDrift > driftThresholdBps;
        performData = "";
    }

    /// @notice Executes a rebalancing swap when called by Chainlink Automation
    /// @dev Wraps/unwraps ETH as needed and swaps via Uniswap V3 exactInputSingle
    function performUpkeep(
        bytes calldata
    ) external override whenNotPaused nonReentrant {
        require(totalShares > 0, "Vault is empty");
        require(
            block.number >= lastRebalanceBlock + minRebalanceInterval,
            "Too soon to rebalance"
        );

        int256 driftBefore = getCurrentDrift();
        uint256 absDrift = driftBefore >= 0
            ? uint256(driftBefore)
            : uint256(-driftBefore);
        require(absDrift > driftThresholdBps, "Drift below threshold");

        (uint256 ethValueUsd, uint256 usdcValueUsd, ) = getPortfolioValue();
        (uint256 ethPrice, uint8 priceDecimals) = _getEthPrice();

        (bool sellEth, uint256 swapAmount) = PortfolioMath.calculateSwapAmount(
            ethValueUsd,
            usdcValueUsd,
            targetAllocationBps,
            ethPrice,
            priceDecimals
        );

        require(swapAmount > 0, "Zero swap amount");

        if (sellEth) {
            _swapEthForUsdc(swapAmount, ethPrice, priceDecimals);
        } else {
            _swapUsdcForEth(swapAmount, ethPrice, priceDecimals);
        }

        rebalanceCount++;
        lastRebalanceBlock = block.number;

        int256 driftAfter = getCurrentDrift();
        emit Rebalanced(block.number, sellEth, swapAmount, driftBefore, driftAfter);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────────────────────

    /// @notice Returns the current USD value of all vault assets
    /// @return ethValueUsd ETH holdings value in 18-decimal USD
    /// @return usdcValueUsd USDC holdings value in 18-decimal USD
    /// @return totalUsd Total portfolio value in 18-decimal USD
    function getPortfolioValue()
        public
        view
        returns (
            uint256 ethValueUsd,
            uint256 usdcValueUsd,
            uint256 totalUsd
        )
    {
        (uint256 ethPrice, uint8 priceDecimals) = _getEthPrice();

        uint256 ethBalance = address(this).balance;
        uint256 usdcBalance = usdc.balanceOf(address(this));

        // ETH value: price feed returns USD with priceDecimals precision
        ethValueUsd = PortfolioMath.calculateValueUsd(
            ethBalance,
            ethPrice,
            18,
            priceDecimals
        );

        // USDC value: treat 1 USDC = $1.00 (represented as 1e8 with 8 price decimals)
        usdcValueUsd = PortfolioMath.calculateValueUsd(usdcBalance, 1e8, 6, 8);

        totalUsd = ethValueUsd + usdcValueUsd;
    }

    /// @notice Returns the current allocation drift of ETH vs target
    /// @return driftBps Signed drift in basis points (positive = ETH over-allocated)
    function getCurrentDrift() public view returns (int256 driftBps) {
        (uint256 ethValueUsd, , uint256 totalUsd) = getPortfolioValue();
        if (totalUsd == 0) return 0;
        uint256 currentBps = PortfolioMath.calculateAllocationBps(
            ethValueUsd,
            totalUsd
        );
        driftBps = PortfolioMath.calculateDrift(currentBps, targetAllocationBps);
    }

    /// @notice Returns the USD value of a specific user's vault position
    /// @param user The address to query
    /// @return ethValue User's proportional ETH holdings in 18-decimal USD
    /// @return usdcValue User's proportional USDC holdings in 18-decimal USD
    function getUserValue(
        address user
    ) external view returns (uint256 ethValue, uint256 usdcValue) {
        if (totalShares == 0) return (0, 0);
        uint256 userShares = shares[user];
        if (userShares == 0) return (0, 0);

        (uint256 ethValueUsd, uint256 usdcValueUsd, ) = getPortfolioValue();
        ethValue = (ethValueUsd * userShares) / totalShares;
        usdcValue = (usdcValueUsd * userShares) / totalShares;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Owner Functions
    // ─────────────────────────────────────────────────────────────────────────────

    /// @notice Update the target ETH allocation
    /// @param newBps New target in basis points (0–10000)
    function setTargetAllocation(uint256 newBps) external onlyOwner {
        require(newBps <= BPS_DENOMINATOR, "Exceeds 100%");
        emit TargetAllocationUpdated(targetAllocationBps, newBps);
        targetAllocationBps = newBps;
    }

    /// @notice Update the drift threshold required to trigger a rebalance
    /// @param newBps New threshold in basis points (1–5000)
    function setDriftThreshold(uint256 newBps) external onlyOwner {
        require(newBps > 0 && newBps <= 5000, "Threshold out of range");
        emit DriftThresholdUpdated(driftThresholdBps, newBps);
        driftThresholdBps = newBps;
    }

    /// @notice Update the maximum allowed swap slippage
    /// @param newBps New max slippage in basis points (1–1000)
    function setMaxSlippage(uint256 newBps) external onlyOwner {
        require(newBps > 0 && newBps <= 1000, "Slippage out of range");
        emit MaxSlippageUpdated(maxSlippageBps, newBps);
        maxSlippageBps = newBps;
    }

    /// @notice Update the minimum number of blocks between rebalances
    /// @param blocks Minimum block interval
    function setMinRebalanceInterval(uint256 blocks) external onlyOwner {
        minRebalanceInterval = blocks;
    }

    /// @notice Pause the vault — disables deposits, USDC deposits, and rebalancing
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the vault
    function unpause() external onlyOwner {
        _unpause();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Receive ETH
    // ─────────────────────────────────────────────────────────────────────────────

    /// @notice Accept ETH sent directly (needed for WETH unwrap and direct deposits)
    receive() external payable {}

    // ─────────────────────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────────────────────

    /// @dev Fetches the latest ETH/USD price from Chainlink, reverts if stale or invalid
    /// @return price The ETH price in USD (with `decimals` precision)
    /// @return decimals The number of decimals in the returned price
    function _getEthPrice()
        internal
        view
        returns (uint256 price, uint8 decimals)
    {
        decimals = priceFeed.decimals();
        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        require(answer > 0, "Invalid price: non-positive");
        require(updatedAt > 0, "Invalid price: no update time");
        require(answeredInRound >= roundId, "Stale price: round incomplete");
        require(
            block.timestamp - updatedAt <= MAX_PRICE_AGE,
            "Stale price: too old"
        );

        price = uint256(answer);
    }

    /// @dev Wraps ETH to WETH and swaps WETH → USDC on Uniswap V3
    /// @param ethAmountWei Amount of ETH to swap (in wei)
    /// @param ethPrice Current ETH price (priceDecimals precision)
    /// @param priceDecimals Decimals of the price feed
    function _swapEthForUsdc(
        uint256 ethAmountWei,
        uint256 ethPrice,
        uint8 priceDecimals
    ) internal {
        require(
            address(this).balance >= ethAmountWei,
            "Insufficient ETH balance"
        );

        // Wrap ETH → WETH
        weth.deposit{value: ethAmountWei}();

        // Approve SwapRouter to spend WETH
        IERC20(address(weth)).forceApprove(address(swapRouter), ethAmountWei);

        // Calculate expected USDC out (6 decimals)
        // ethAmountWei (18 dec) * ethPrice / 10^priceDecimals → USD in 18 dec
        // then / 1e12 to get USDC (6 dec)
        uint256 expectedUsdcOut = (ethAmountWei * ethPrice) /
            (10 ** uint256(priceDecimals) * 1e12);

        uint256 amountOutMinimum = (expectedUsdcOut *
            (BPS_DENOMINATOR - maxSlippageBps)) / BPS_DENOMINATOR;

        swapRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: address(weth),
                tokenOut: address(usdc),
                fee: POOL_FEE,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: ethAmountWei,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            })
        );
    }

    /// @dev Swaps USDC → WETH on Uniswap V3, then unwraps WETH to ETH
    /// @param usdcAmount Amount of USDC to swap (6 decimal precision)
    /// @param ethPrice Current ETH price (priceDecimals precision)
    /// @param priceDecimals Decimals of the price feed
    function _swapUsdcForEth(
        uint256 usdcAmount,
        uint256 ethPrice,
        uint8 priceDecimals
    ) internal {
        require(
            usdc.balanceOf(address(this)) >= usdcAmount,
            "Insufficient USDC balance"
        );

        // Approve SwapRouter to spend USDC
        usdc.forceApprove(address(swapRouter), usdcAmount);

        // Calculate expected WETH out (18 decimals)
        // usdcAmount (6 dec) → USD in 18 dec (* 1e12)
        // WETH = USD / ethPrice * 10^priceDecimals
        uint256 usdValueUsd18 = usdcAmount * 1e12;
        uint256 expectedWethOut = (usdValueUsd18 *
            10 ** uint256(priceDecimals)) / ethPrice;

        uint256 amountOutMinimum = (expectedWethOut *
            (BPS_DENOMINATOR - maxSlippageBps)) / BPS_DENOMINATOR;

        uint256 wethReceived = swapRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: address(usdc),
                tokenOut: address(weth),
                fee: POOL_FEE,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: usdcAmount,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            })
        );

        // Unwrap WETH → ETH
        weth.withdraw(wethReceived);
    }
}
