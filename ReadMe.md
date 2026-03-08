# RebalanceVault — Autonomous On-Chain Portfolio Rebalancer

> A production-grade, upgradeable DeFi vault built on the EIP-2535 Diamond standard that automatically maintains target asset allocations using real Uniswap V3 liquidity, Chainlink oracle pricing, and Aave yield generation.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Architecture Overview](#architecture-overview)
- [Diamond Pattern (EIP-2535)](#diamond-pattern-eip-2535)
- [Smart Contract System](#smart-contract-system)
  - [Core Diamond](#core-diamond)
  - [Facets](#facets)
  - [Strategies](#strategies)
  - [Adapters](#adapters)
  - [Libraries](#libraries)
  - [Storage](#storage)
- [Rebalancing Engine](#rebalancing-engine)
- [Guard System](#guard-system)
- [Fee System](#fee-system)
- [Yield System](#yield-system)
- [Oracle Integration](#oracle-integration)
- [User Flows](#user-flows)
- [Deployment](#deployment)
- [Configuration Reference](#configuration-reference)
- [Security Considerations](#security-considerations)
- [Technical Specifications](#technical-specifications)

---

## Problem Statement

Crypto holders face a structural dilemma: holding volatile assets like ETH exposes them to severe drawdowns, while sitting in stablecoins forfeits upside. Manual rebalancing — the proven solution — requires constant price monitoring, precise timing, gas cost management, and emotional discipline. Most retail participants fail at all four.

Existing on-chain vault solutions are either:
- **Too rigid** — hardcoded strategies that cannot be updated without full redeployment and fund migration
- **Too simple** — single-contract designs with no upgrade path, no risk management, no yield on idle assets
- **Too centralized** — relying on off-chain keepers with no on-chain enforcement of rebalance conditions

**RebalanceVault solves all three.**

---

## Solution

RebalanceVault is a fully autonomous, upgradeable on-chain vault that:

1. **Accepts ETH deposits** and issues proportional shares to depositors
2. **Automatically rebalances** between ETH and USDC to maintain a configurable target allocation (default 50/50)
3. **Uses real DeFi infrastructure** — Chainlink for prices, Uniswap V3 for swaps, Aave for yield on idle capital
4. **Enforces risk controls** via an on-chain guard system with circuit breakers, rate limiting, and volatility detection
5. **Remains fully upgradeable** via the Diamond proxy pattern — strategies, adapters, and fee logic can all be replaced without migrating user funds

The result: deposit once, the vault manages the rest — rebalancing on autopilot, earning yield between rebalances, and protecting capital during extreme market conditions.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Diamond Proxy                        │
│              0x26F9Ec14564B73DC95a79898...              │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │VaultFacet│  │Rebalance │  │ Oracle   │             │
│  │deposit() │  │Facet     │  │ Facet    │             │
│  │withdraw()│  │checkUp() │  │getPrice()│             │
│  └──────────┘  │perfUp()  │  └──────────┘             │
│                └──────────┘                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │GuardFacet│  │ FeeFacet │  │YieldFacet│             │
│  │isRebal   │  │accrueMgt │  │deposit() │             │
│  │Safe()    │  │claimFees │  │harvest() │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Strategy  │  │AdminFacet│  │ViewFacet │             │
│  │Facet     │  │setTarget │  │getPortfo │             │
│  │setStrat()│  │pause()   │  │lioSummar │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│              Shared AppStorage (slot 0)                 │
└─────────────────────────────────────────────────────────┘
         │                    │                  │
         ▼                    ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Chainlink   │   │  Uniswap V3  │   │   Aave V3    │
│  ETH/USD     │   │  Router      │   │   Pool       │
│  Price Feed  │   │  WETH↔USDC   │   │  USDC Yield  │
└──────────────┘   └──────────────┘   └──────────────┘
         │
         ▼
┌──────────────┐   ┌──────────────┐
│  Threshold   │   │   Band       │
│  Strategy    │   │   Strategy   │
│  (active)    │   │  (pluggable) │
└──────────────┘   └──────────────┘
```

---

## Diamond Pattern (EIP-2535)

### What Is It

EIP-2535 Diamond is a proxy architecture where a single contract address (the Diamond) delegates all function calls to a set of implementation contracts called facets. Each facet handles a specific domain of logic. All facets share the same storage through the Diamond's state.

### Why It Was Chosen

| Problem | Diamond Solution |
|---------|-----------------|
| Single contract size limit (24KB) | Logic split across unlimited facets |
| Cannot upgrade deployed vault | Replace facets without migrating funds |
| Monolithic code is hard to audit | Each facet is a focused, auditable unit |
| Strategy changes require redeployment | Swap strategy contract via `setActiveStrategy()` |
| Adapter changes require fund migration | Swap adapter via `setSwapAdapter()` |

### How It Works

Every call to the Diamond address hits the `fallback()` function:

```solidity
fallback() external payable {
    LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;
    require(facet != address(0), "Diamond: Function does not exist");
    
    assembly {
        calldatacopy(0, 0, calldatasize())
        let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
        returndatacopy(0, 0, returndatasize())
        switch result
        case 0 { revert(0, returndatasize()) }
        default { return(0, returndatasize()) }
    }
}
```

The 4-byte function selector (`msg.sig`) maps to a facet address. The call is `delegatecall`ed to that facet, meaning the facet's code runs in the Diamond's storage context. Users interact with one address; the system routes internally.

### Storage Pattern

All facets share `AppStorage` located at storage slot 0:

```solidity
function appStorage() pure returns (AppStorage storage s) {
    assembly { s.slot := 0 }
}
```

This is the **AppStorage pattern** — safer than unstructured storage because it uses a typed struct, making storage collisions impossible between facets as long as the struct layout never changes.

DiamondStorage (for the routing table itself) uses a separate deterministic slot:

```solidity
bytes32 constant DIAMOND_STORAGE_POSITION = 
    keccak256("diamond.standard.diamond.storage");
```

---

## Smart Contract System

### Core Diamond

#### `Diamond.sol`
The proxy entry point. Constructor registers `DiamondCutFacet` as the bootstrap facet. Contains only `fallback()` and `receive()`. Has no business logic — it is purely a routing layer.

#### `DiamondCutFacet.sol`
The upgrade mechanism. Exposes `diamondCut(FacetCut[], address, bytes)` which allows the owner to add, replace, or remove function selectors. This is the only function that can modify the routing table.

```solidity
enum FacetCutAction { Add, Replace, Remove }

struct FacetCut {
    address facetAddress;
    FacetCutAction action;
    bytes4[] functionSelectors;
}
```

#### `LibDiamond.sol`
Internal library handling all routing table mutations. Maintains:
- `selectorToFacetAndPosition` — maps `bytes4` selector → facet address
- `facetFunctionSelectors` — maps facet address → its selectors
- `facetAddresses` — ordered list of all registered facets
- `supportedInterfaces` — ERC-165 interface registry

---

### Facets

#### `VaultFacet.sol` — Deposit & Withdrawal
Handles user-facing fund management.

**`deposit()`** — accepts ETH, mints shares:
```
sharesToMint = (depositValueUsd × totalShares) / totalValueBeforeDeposit
```
First depositor receives shares equal to wei deposited (1:1 bootstrap). Subsequent depositors receive shares proportional to their USD contribution relative to existing TVL.

**`depositUSDC(uint256)`** — accepts USDC, same share math with USDC value.

**`withdraw(uint256 shareAmount)`** — burns shares, returns proportional ETH + USDC:
```
ethOut  = (ethBalance  × shareAmount) / totalShares
usdcOut = (usdcBalance × shareAmount) / totalShares
```

**`emergencyWithdraw()`** — same as withdraw but uses full user balance, bypasses pause check. Safety escape hatch.

---

#### `RebalanceFacet.sol` — Rebalancing Engine
The core automation logic. Compatible with Chainlink Automation's `AutomationCompatible` interface.

**`checkUpkeep(bytes)`** — view function, returns `true` when:
- Vault is not paused
- Total shares > 0
- Active strategy is set
- Minimum block interval has passed
- Strategy's `shouldRebalance()` returns true

**`performUpkeep(bytes)`** — executes the rebalance:
1. Fetches portfolio value from Chainlink
2. Asks strategy for swap direction and amount
3. Calls `GuardFacet.isRebalanceSafe()` — aborts if unsafe
4. Executes swap via `UniswapV3Adapter`
5. Unwraps WETH back to ETH if buying ETH
6. Records stats: count, block, price, volume, gas, slippage

---

#### `OracleFacet.sol` — Price & Portfolio Valuation
Wraps Chainlink `AggregatorV3Interface` with staleness protection.

```solidity
uint256 constant STALENESS_THRESHOLD = 3600; // 1 hour

require(block.timestamp - updatedAt <= STALENESS_THRESHOLD, 
    "OracleFacet: Stale price");
```

Exposes:
- `getEthPrice()` — current ETH/USD with decimals
- `getPortfolioValue()` — ETH value + USDC value + total in USD
- `getCurrentDrift()` — signed drift from target in basis points
- `isPriceStale()` — staleness check

---

#### `StrategyFacet.sol` — Strategy Management
Manages the pluggable rebalancing strategy.

- `setActiveStrategy(address)` — owner swaps strategy contract live
- `shouldRebalance()` — delegates to active strategy
- `getSwapParams()` — gets direction + amount from strategy
- `getActiveStrategy()` — returns address and name

The strategy interface is minimal:
```solidity
interface IRebalanceStrategy {
    function shouldRebalance(
        uint256 ethValueUsd, uint256 usdcValueUsd,
        uint256 targetBps, uint256 lastRebalanceBlock
    ) external view returns (bool);

    function calculateSwap(
        uint256 ethValueUsd, uint256 usdcValueUsd,
        uint256 targetBps, uint256 ethPrice, uint8 priceDecimals
    ) external view returns (bool sellEth, uint256 amount);

    function name() external pure returns (string memory);
}
```

---

#### `GuardFacet.sol` — Risk Management
Multi-layered protection system. Called before every rebalance.

**`isRebalanceSafe(uint256 swapAmountUsd)`** checks four conditions in sequence:
1. Circuit breaker not tripped
2. Volatility within bounds
3. Rate limit not exceeded
4. Swap size within portfolio cap

**`tripCircuitBreaker(string reason)`** — owner can manually halt rebalancing. Emit `CircuitBreakerTripped`.

**`resetCircuitBreaker()`** — owner re-enables rebalancing, resets price baseline and rate limit window.

**`setGuardParams(maxPriceChangeBps, maxRebalancesPerWindow, windowSizeBlocks, maxSwapSizeBps)`** — configure all guard parameters.

**`initializeGuard(uint256 currentPrice)`** — sets the price baseline for volatility tracking. Must be called after deployment.

---

#### `FeeFacet.sol` — Fee Accrual & Collection
Two-tier fee system standard in professional fund management.

**Management Fee** — time-based, accrues continuously:
```solidity
uint256 annualFee = (totalUsd × managementFeeBps) / 10_000;
uint256 fee = (annualFee × elapsed) / SECONDS_PER_YEAR;
```

**Performance Fee** — profit-based with high water mark:
```solidity
// Only charges fee on profit ABOVE all-time high share price
if (currentSharePrice <= highWaterMark) return;
uint256 profit = currentSharePrice - highWaterMark;
uint256 fee = (profit × totalShares / 1e18) × performanceFeeBps / 10_000;
highWaterMark = currentSharePrice; // Advance the mark
```

The high water mark prevents double-charging: if share price drops and recovers, no performance fee is charged on the recovery.

**`claimFees()`** — fee recipient pulls accrued fees as USDC.

---

#### `YieldFacet.sol` — Idle Capital Yield
Deploys idle USDC to Aave V3 while it waits between rebalances.

- `depositToYield(uint256)` — sends USDC to Aave via adapter
- `withdrawFromYield(uint256)` — retrieves USDC from Aave
- `harvestYield()` — records yield earned above principal
- `getYieldBalance()` — queries current aToken balance

**Verified on mainnet state:** depositing 1,000 USDC immediately reflects accrued interest (`1,000.000132 USDC` balance), proving integration with live Aave V3 liquidity.

---

#### `AdminFacet.sol` — Configuration & Access Control
Owner-gated configuration surface.

- `initializeVault(...)` — one-time setup, sets all core addresses and params. Guards against re-initialization with `require(s.priceFeed == address(0))`.
- `setTargetAllocation(uint256)` — change the ETH/USDC target ratio
- `setDriftThreshold(uint256)` — change rebalance sensitivity
- `setMaxSlippage(uint256)` — change slippage tolerance
- `setSwapAdapter(address)` — hot-swap the DEX adapter
- `pause()` / `unpause()` — emergency controls
- `grantRole(bytes32, address)` — role-based access control

---

#### `ViewFacet.sol` — Read-Only Analytics
Pure view functions for frontends and analytics platforms.

- `getPortfolioSummary()` — full portfolio state in one call
- `getSharePrice()` — current USD value per share (18 decimals)
- `getUserPosition(address)` — user's shares, ETH value, USDC value
- `getVaultConfig()` — all configuration parameters
- `getRebalanceStats()` — historical performance metrics
- `getFeeInfo()` — fee rates, high water mark, accrued amount
- `getGuardStatus()` — circuit breaker state, rate limit window
- `getYieldInfo()` — deposited amount, yield earned, enabled state

---

#### `DiamondLoupeFacet.sol` — Introspection (ERC-165 / EIP-2535)
Standard facet discovery. Allows block explorers, frontends, and other contracts to inspect the Diamond's capabilities without any off-chain configuration.

- `facets()` — all facet addresses with their selectors
- `facetFunctionSelectors(address)` — selectors for one facet
- `facetAddresses()` — all registered facet addresses
- `facetAddress(bytes4)` — which facet handles a selector
- `supportsInterface(bytes4)` — ERC-165 compliance

---

#### `OwnershipFacet.sol` — Ownership Management
- `owner()` — current Diamond owner
- `transferOwnership(address)` — transfer control (two-step recommended for production)

---

### Strategies

#### `ThresholdStrategy.sol` — Simple Drift Threshold
**Active strategy.** Triggers a rebalance whenever absolute drift from target exceeds `driftThresholdBps`.

```
|currentAllocation - targetAllocation| > threshold → rebalance
```

Configured with:
- `driftThresholdBps` — how far drift can go before rebalancing (e.g. 500 = 5%)
- `minBlockInterval` — minimum blocks between rebalances

Best for: steady markets, frequent small corrections, maximizing allocation precision.

#### `BandStrategy.sol` — Upper/Lower Band
**Available strategy.** Defines an explicit upper and lower band. Only rebalances when allocation breaks outside the band entirely.

```
upperBand = targetBps + bandWidthBps
lowerBand = targetBps - bandWidthBps

rebalance only if: currentBps > upperBand OR currentBps < lowerBand
```

Configured with:
- `bandWidthBps` — half-width of the band
- `minBlockInterval` — minimum blocks between rebalances
- `anchorPrice` — ETH price at strategy deployment (reference point)

Best for: volatile markets, reducing gas costs, avoiding over-trading during normal fluctuations.

**Switching strategies is a single transaction:**
```solidity
strategyFacet.setActiveStrategy(bandStrategyAddress);
```

No redeployment. No fund migration. No downtime.

---

### Adapters

#### `UniswapV3Adapter.sol` — DEX Swap Execution
Wraps Uniswap V3 `exactInputSingle` for WETH↔USDC swaps.

```solidity
ISwapRouter.ExactInputSingleParams({
    tokenIn:  tokenIn,
    tokenOut: tokenOut,
    fee:      3000,        // 0.3% pool
    recipient: recipient,
    deadline:  block.timestamp + 300,
    amountIn:  amountIn,
    amountOutMinimum: minOut,  // slippage protected
    sqrtPriceLimitX96: 0
});
```

Uses the `WETH/USDC 0.3%` pool — the deepest ETH liquidity on Uniswap V3.

Implements `ISwapAdapter` so it can be hot-swapped for any other DEX without changing vault logic:
```solidity
interface ISwapAdapter {
    function swap(address tokenIn, address tokenOut, 
                  uint256 amountIn, uint256 minAmountOut, 
                  address recipient) external returns (uint256);
}
```

#### `AaveYieldAdapter.sol` — Yield on Idle USDC
Deposits idle USDC into Aave V3 lending pool to earn yield between rebalances.

- Deposits via `aavePool.supply(token, amount, address(this), 0)`
- Tracks aToken balances for each underlying token
- `getYieldEarned()` returns `aTokenBalance - totalDeposited`
- Implements `IYieldAdapter` for hot-swappability

---

### Libraries

#### `PortfolioMath.sol`
Core math for all portfolio calculations. All functions are `internal pure`.

```solidity
// Convert token balance to USD value (18 decimal precision)
calculateValueUsd(amount, priceUsd, tokenDecimals, priceDecimals)

// What % of portfolio is this asset (in basis points)
calculateAllocationBps(partUsd, totalUsd)

// Signed drift from target (-5000 to +5000 bps range)
calculateDrift(currentBps, targetBps)

// How much to swap and in which direction
calculateSwapAmount(ethValueUsd, usdcValueUsd, targetBps, ethPrice, priceDecimals)
```

#### `SwapMath.sol`
Swap-specific calculations.

```solidity
// Apply slippage tolerance to expected output
calculateMinOutput(expectedOut, slippageBps)

// ETH amount → expected USDC out
calculateExpectedUsdcOut(ethAmountWei, ethPriceUsd, priceDecimals)

// USDC amount → expected WETH out
calculateExpectedWethOut(usdcAmount, ethPriceUsd, priceDecimals)

// Measure actual price impact vs expected
calculatePriceImpact(amountIn, amountOut, expectedOut)
```

---

### Storage

#### `AppStorage.sol`
Single typed struct at slot 0 shared across all facets. Organized by domain:

```solidity
struct AppStorage {
    // Vault core
    mapping(address => uint256) shares;
    uint256 totalShares;

    // Rebalance config
    uint256 targetAllocationBps;
    uint256 driftThresholdBps;
    uint256 maxSlippageBps;
    uint256 minRebalanceInterval;

    // Rebalance state
    uint256 rebalanceCount;
    uint256 lastRebalanceBlock;
    uint256 lastRebalancePrice;
    uint256 totalVolumeSwapped;

    // Protocol addresses
    address priceFeed;      // Chainlink ETH/USD
    address swapAdapter;    // UniswapV3Adapter
    address yieldAdapter;   // AaveYieldAdapter
    address activeStrategy; // ThresholdStrategy / BandStrategy
    address usdc;
    address weth;
    address swapRouter;

    // Fee system
    uint256 managementFeeBps;
    uint256 performanceFeeBps;
    uint256 highWaterMark;
    uint256 accruedFees;
    uint256 lastFeeTimestamp;
    address feeRecipient;

    // Guard system
    uint256 maxSwapSizeBps;
    uint256 maxPriceChangeBps;
    uint256 lastKnownPrice;
    uint256 rebalancesInWindow;
    uint256 windowStartBlock;
    uint256 maxRebalancesPerWindow;
    uint256 windowSizeBlocks;
    bool circuitBreakerTripped;

    // Yield tracking
    uint256 totalDepositedToAave;
    uint256 totalYieldEarned;
    bool yieldEnabled;

    // Access control
    mapping(bytes32 => mapping(address => bool)) roles;

    // System state
    bool paused;
    uint256 totalGasUsed;
    uint256 totalSlippageLost;
}
```

---

## Rebalancing Engine

### Full Rebalance Execution Flow

```
1. Chainlink Automation calls checkUpkeep()
   ├── paused? → return false
   ├── totalShares == 0? → return false
   ├── block < lastRebalanceBlock + minInterval? → return false
   └── strategy.shouldRebalance()? → return true/false

2. If true → performUpkeep() called
   ├── Get portfolio value (ETH balance + USDC balance in USD)
   ├── Get ETH price from Chainlink
   ├── Calculate drift before swap
   ├── Ask strategy: sellEth=true/false, amount=X
   ├── Call guard.isRebalanceSafe(swapAmountUsd)
   │   ├── Circuit breaker check
   │   ├── Volatility check (updates lastKnownPrice)
   │   ├── Rate limit check (updates rebalancesInWindow)
   │   └── Swap size check
   ├── Execute swap:
   │   ├── If sellEth:
   │   │   ├── IWETH.deposit{value: ethAmount}()
   │   │   ├── IERC20(weth).approve(adapter, amount)
   │   │   └── adapter.swap(weth, usdc, amount, minOut, this)
   │   └── If buyEth:
   │       ├── IERC20(usdc).approve(adapter, amount)
   │       ├── adapter.swap(usdc, weth, amount, minOut, this)
   │       └── IWETH.withdraw(wethReceived)
   ├── Update stats (count, block, price, volume, gas, slippage)
   └── Emit Rebalanced(block, soldEth, amount, amountOut, driftBefore, driftAfter)
```

### Slippage Tracking
Every swap records actual vs expected output:
```solidity
if (expectedUsdc > usdcReceived) {
    s.totalSlippageLost += (expectedUsdc - usdcReceived);
}
```

This allows analytics on cumulative trading costs over time.

---

## Guard System

### Four-Layer Protection

```
Layer 1: Circuit Breaker
├── Manual trip by owner: tripCircuitBreaker("reason")
├── Auto-trip on volatility breach
└── Blocks ALL rebalances until manually reset

Layer 2: Volatility Detection
├── Compares current Chainlink price to lastKnownPrice
├── Calculates changeBps = |currentPrice - lastPrice| / lastPrice × 10000
├── If changeBps > maxPriceChangeBps → trip circuit breaker
└── Updates lastKnownPrice on every check

Layer 3: Rate Limiting
├── Sliding window: windowSizeBlocks blocks
├── Max rebalancesInWindow per window
├── Window resets when block.number > windowStartBlock + windowSizeBlocks
└── Prevents MEV-driven rebalance spam

Layer 4: Swap Size Cap
├── maxSwapSizeBps as % of total portfolio value
├── Prevents any single swap from being too large relative to TVL
└── Protects against price manipulation on low-liquidity days
```

### Default Guard Parameters
```
maxPriceChangeBps:     1000  (10% max price move)
maxRebalancesPerWindow:   5  (5 rebalances per window)
windowSizeBlocks:       100  (per 100 blocks ~20 minutes)
maxSwapSizeBps:        2500  (max 25% of portfolio per swap)
```

---

## Fee System

### Management Fee
Annual percentage of AUM, accrued per second:

```
Daily fee = (TVL × managementFeeBps / 10000) / 365
```

Default: 200 bps (2% annually)

### Performance Fee
Percentage of profits above the high water mark:

```
If sharePrice > highWaterMark:
    profit = (sharePrice - highWaterMark) × totalShares
    fee = profit × performanceFeeBps / 10000
    highWaterMark = sharePrice
```

Default: 2000 bps (20% of profits)

The high water mark is a fairness mechanism: if the vault loses 20% then recovers 20%, no performance fee is charged on the recovery — only on genuine new profit above the previous peak.

---

## Yield System

### How Idle Capital Earns

Between rebalances, USDC sits idle in the vault. The yield system deploys this to Aave V3:

```
Vault holds 4,857 USDC idle
→ YieldFacet.depositToYield(4857_000000)
→ AaveYieldAdapter.deposit(usdc, amount)
→ aavePool.supply(usdc, amount, adapter, 0)
→ Adapter receives aUSDC (interest-bearing token)
→ aUSDC balance grows every block
→ On next rebalance: withdrawFromYield() first
→ Net effect: USDC earns ~3-5% APY while waiting
```

### Yield Tracking
```solidity
function getYieldEarned(address token, uint256 totalDeposited) 
    returns (uint256) 
{
    uint256 currentBalance = IERC20(aToken).balanceOf(address(this));
    if (currentBalance <= totalDeposited) return 0;
    return currentBalance - totalDeposited;
}
```

---

## Oracle Integration

### Chainlink AggregatorV3Interface

All price data comes from Chainlink's decentralized oracle network. No centralized price source.

```solidity
(, int256 answer, , uint256 updatedAt, ) = feed.latestRoundData();
require(answer > 0, "Invalid price");
require(block.timestamp - updatedAt <= 3600, "Stale price");
```

**Mainnet address:** `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` (ETH/USD)

### USD Value Calculation

All portfolio math uses a unified USD precision of `1e18`:

```solidity
function calculateValueUsd(
    uint256 amount,        // token amount in native decimals
    uint256 priceUsd,      // Chainlink price
    uint8 tokenDecimals,   // e.g. 18 for ETH, 6 for USDC
    uint8 priceDecimals    // e.g. 8 for Chainlink
) returns (uint256) {
    return (amount × priceUsd × 1e18) / (10^tokenDecimals × 10^priceDecimals);
}
```

This ensures consistent basis point calculations regardless of token decimal differences.

---

## User Flows

### Deposit ETH
```bash
vault.deposit{value: 5 ether}()
```
Receive shares. Portfolio automatically begins rebalancing toward target.

### Deposit USDC
```bash
usdc.approve(diamondAddress, amount);
vault.depositUSDC(amount);
```

### Check Your Position
```bash
vault.getUserPosition(yourAddress)
# Returns: shares, ethValue, usdcValue
```

### Withdraw
```bash
vault.withdraw(shareAmount)
# Returns proportional ETH + USDC
```

### Emergency Withdraw
```bash
vault.emergencyWithdraw()
# Returns all your shares, works even when paused
```

---

## Deployment

### Prerequisites
```bash
node >= 18
npm install
cp .env.example .env
# Fill in: PRIVATE_KEY, RPC_URL
```

### Deploy Diamond
```bash
npx hardhat run scripts/deploy-diamond.ts --network <network>
```

### Initialize Vault (if deploy script fails mid-way)
```bash
npx hardhat run scripts/init-vault.ts --network <network>
```

### Generate Combined ABI
```bash
npx hardhat run scripts/generate-abi.ts
# Outputs diamond-abi.json with all facet functions
```

### Deposit & Test
```bash
npx hardhat run scripts/deposit.ts --network <network>
npx hardhat run scripts/simulate-rebalances.ts --network <network>
```

### Check Status
```bash
npx hardhat run scripts/check-status.ts --network <network>
```

---

## Configuration Reference

### Core Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `targetAllocationBps` | 5000 | Target ETH allocation (50%) |
| `driftThresholdBps` | 100 | Rebalance trigger drift (1%) |
| `maxSlippageBps` | 100 | Max swap slippage (1%) |
| `minRebalanceInterval` | 10 | Min blocks between rebalances |

### Fee Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `managementFeeBps` | 200 | Annual management fee (2%) |
| `performanceFeeBps` | 2000 | Performance fee on profits (20%) |

### Guard Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maxPriceChangeBps` | 1000 | Max ETH price move (10%) |
| `maxRebalancesPerWindow` | 5 | Rate limit per window |
| `windowSizeBlocks` | 100 | Rate limit window size |
| `maxSwapSizeBps` | 2500 | Max single swap size (25% TVL) |

---

## Security Considerations

### Access Control
- All state-changing admin functions require `LibDiamond.enforceIsContractOwner()`
- Role-based access control available via `AdminFacet.grantRole()`
- In production, ownership should be transferred to a multisig (Gnosis Safe) or timelock

### Known Limitations
- `AaveYieldAdapter.setAToken()` has no access control — should be restricted to owner in production
- `UniswapV3Adapter` sets `deadline: block.timestamp` — should use `block.timestamp + 300` for mempool safety
- No two-step ownership transfer — direct `transferOwnership` could lock contract if wrong address used

### Upgrade Risk
- `diamondCut()` can add, replace or remove any function — owner has full control
- Mitigation: transfer ownership to timelock with 48h delay before mainnet deployment
- DiamondLoupe allows anyone to audit exactly what code is installed at any time

### Reentrancy
- ETH transfers use `call{value}` — wrapped in checks-effects-interactions pattern
- USDC transfers use OpenZeppelin `SafeERC20`
- No cross-facet reentrancy vectors identified (all storage writes happen before external calls in withdraw paths)

---

## Technical Specifications

| Property | Value |
|----------|-------|
| Solidity | ^0.8.20 |
| Diamond Standard | EIP-2535 |
| Price Oracle | Chainlink AggregatorV3 |
| DEX | Uniswap V3 (0.3% pool) |
| Yield Protocol | Aave V3 |
| Automation | Chainlink Automation (time-based) |
| Share Precision | 1e18 (18 decimals) |
| USD Precision | 1e18 internal |
| Basis Points | 10,000 = 100% |
| Facet Count | 11 |
| Total Functions | 55+ |
| Storage Pattern | AppStorage at slot 0 |

### Deployed Addresses (Stagenet)

| Contract | Address |
|----------|---------|
| Diamond | `0x26F9Ec14564B73DC95a79898bce62656a9A5503D` |
| ThresholdStrategy | `0x7747bA454bC5CCaCD5Ff7684eDF8cf8d30bf626c` |
| UniswapV3Adapter | `0x6892A4795939eF6186484079dEbAc6ae6c2A42E4` |

### External Protocol Addresses (Mainnet)

| Protocol | Address |
|----------|---------|
| Chainlink ETH/USD | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` |
| Uniswap V3 Router | `0xE592427A0AEce92De3Edee1F18E0157C05861564` |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| Aave V3 Pool | `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` |