# RebalanceVault — Automated Portfolio Rebalancer

![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)
![Hardhat](https://img.shields.io/badge/Hardhat-v2-yellow)
![Chainlink](https://img.shields.io/badge/Chainlink-Automation%20%7C%20Price%20Feeds-375BD2)
![Uniswap](https://img.shields.io/badge/Uniswap-V3-FF007A)
![License](https://img.shields.io/badge/License-MIT-green)

> Built for the **contract.dev Stagenet Hackathon** (Feb 27 – Mar 14, 2026) · DeFi / Smart Contract Systems track

---

## Overview

RebalanceVault is an on-chain portfolio manager that keeps your ETH/USDC holdings at a configurable target allocation (default: 50/50 by USD value). When market price movements cause the portfolio to drift beyond a threshold (default: 5%), Chainlink Automation triggers an automatic rebalance — swapping tokens via Uniswap V3 to restore the target ratio.

The entire system runs on a **contract.dev Stagenet** that replays real Ethereum mainnet blocks, giving the vault access to actual historical ETH prices, real Uniswap V3 liquidity, and genuine Chainlink oracle updates across thousands of blocks.

---

## How It Works

```
User deposits ETH + USDC
        │
        ▼
  RebalanceVault
  ┌─────────────────────────────────────┐
  │  Tracks: ETH balance + USDC balance │
  │  Computes: USD value via Chainlink  │
  │  Shares: proportional ownership     │
  └──────────────┬──────────────────────┘
                 │  every block
                 ▼
  Chainlink Automation calls checkUpkeep()
        │
        ├─ drift ≤ threshold → skip
        │
        └─ drift > threshold → performUpkeep()
                    │
                    ▼
            Uniswap V3 swap
            (ETH→USDC or USDC→ETH)
                    │
                    ▼
            Allocation restored ✓
```

### Step-by-step

1. **Deposit** — Users call `deposit()` with ETH or `depositUSDC(amount)`. They receive vault shares proportional to their USD contribution.
2. **Price check** — Chainlink ETH/USD feed provides real-time ETH price. Vault computes ETH value + USDC value = total portfolio USD.
3. **Drift detection** — If `|current_eth_allocation - target_allocation| > threshold`, upkeep is needed.
4. **Rebalance** — `performUpkeep()` wraps/unwraps ETH as WETH and executes a swap on Uniswap V3 `exactInputSingle`, restoring the target ratio.
5. **Withdraw** — Users call `withdraw(shares)` to redeem their proportional ETH + USDC at any time.

---

## Architecture

```
                          ┌──────────────────────────────┐
                          │      Chainlink Automation     │
                          │  (calls checkUpkeep every     │
                          │   block on Stagenet)          │
                          └──────────┬───────────────────┘
                                     │ performUpkeep()
              deposit()              ▼
User ────────────────────► RebalanceVault.sol
              withdraw()       │          │
                               │          │
                   swap WETH   │          │  getPrice()
                      ▼        │          ▼
              Uniswap V3   ◄───┘   Chainlink ETH/USD
              SwapRouter             Price Feed
              (0.3% pool)       (0x5f4eC3Df...)
         (0xE592427A...)
```

**Contracts:**

| File | Purpose |
|------|---------|
| `contracts/RebalanceVault.sol` | Core vault — deposits, withdrawals, rebalance logic |
| `contracts/libraries/PortfolioMath.sol` | Pure math — allocation, drift, swap amount calculations |
| `contracts/interfaces/ISwapRouter.sol` | Uniswap V3 SwapRouter interface |
| `contracts/test/MockContracts.sol` | Mock contracts for unit testing only |

---

## Built With

- **Solidity 0.8.20** — Smart contracts
- **Hardhat v2** — Compilation, testing, deployment
- **OpenZeppelin Contracts v5** — ReentrancyGuard, Ownable, Pausable, SafeERC20
- **Chainlink Contracts** — AutomationCompatibleInterface, AggregatorV3Interface
- **Uniswap V3** — Token swap execution
- **TypeScript** — All scripts and tests
- **contract.dev Stagenet** — Mainnet-replay testing environment

---

## Stagenet Integration

This project is purpose-built for **contract.dev Stagenet**, which replays real Ethereum mainnet blocks:

### Why Stagenet is essential for this project

| Feature | Static Fork | contract.dev Stagenet |
|---------|-------------|----------------------|
| Real ETH price movements | No (frozen at fork block) | **Yes** — live mainnet replay |
| Chainlink oracle updates | No | **Yes** — real oracle transactions |
| Uniswap V3 liquidity | Snapshot only | **Yes** — real liquidity and slippage |
| Simulate weeks of rebalances | No | **Yes** — thousands of blocks |
| Workspace analytics | No | **Yes** — TVL charts, data tracking |

### Analytics tracked in the Workspace

- **TVL Chart** — Portfolio total value over time (ETH + USDC in USD)
- **Data Tracking:**
  - `getCurrentDrift()` — allocation drift per block (target: near 0)
  - `getPortfolioValue()` — ETH vs USDC breakdown over time
  - `rebalanceCount` — cumulative rebalances triggered
- **Transactions View** — Every rebalance decoded with drift before/after, swap direction, and amount

### CI/CD Integration

1. Push to GitHub → contract.dev auto-detects new commits
2. Contract Workspaces update with latest deployment
3. TVL and data tracking continue across deployments

---

## Quick Start

### Prerequisites
- Node.js 18+
- A contract.dev Stagenet RPC URL
- A funded Stagenet wallet (use the contract.dev Faucet for 1000 ETH)

### Setup

```bash
git clone <your-repo>
cd rebalance-vault

npm install

cp .env.example .env
# Edit .env with your Stagenet RPC URL and private key

npx hardhat compile
```

### Deploy

```bash
npx hardhat run scripts/deploy.ts --network stagenet
```

Copy the deployed contract address into `.env` as `VAULT_ADDRESS`.

### Fund the Vault

```bash
# Deposit 5 ETH
npx hardhat run scripts/deposit.ts --network stagenet
```

For USDC: use the contract.dev Token Faucet to get USDC, approve the vault, then call `depositUSDC(amount)` directly or add a script.

### Register Chainlink Automation

1. Go to your contract.dev project → **Chainlink** → **Automation**
2. Create a new upkeep pointing to your `VAULT_ADDRESS`
3. The automation will call `checkUpkeep()` on every Stagenet block
4. When drift exceeds threshold → `performUpkeep()` triggers a rebalance

---

## Usage

### Check vault status

```bash
npx hardhat run scripts/check-status.ts --network stagenet
```

Output:
```
Portfolio Value:
  ETH value:   $5000.00
  USDC value:  $5000.00
  Total value: $10000.00

Allocation:
  Target ETH:      5000 bps (50%)
  Current ETH:     5000 bps (50%)
  Drift:           0 bps
  Rebalance needed: NO

Rebalance History:
  Total rebalances:      42
  Last rebalance block:  19482750
```

### Run simulation loop

```bash
npx hardhat run scripts/simulate-rebalances.ts --network stagenet
```

Polls 20 times, calling `performUpkeep()` whenever drift exceeds the threshold.

### Withdraw

```bash
npx hardhat run scripts/withdraw.ts --network stagenet
```

Burns all your shares and returns proportional ETH + USDC.

---

## Contract Addresses (Ethereum Mainnet = Stagenet)

| Contract | Address |
|---------|---------|
| Chainlink ETH/USD Feed | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` |
| Uniswap V3 SwapRouter | `0xE592427A0AEce92De3Edee1F18E0157C05861564` |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |

---

## Key Metrics

After running the vault on Stagenet, look for these in your Contract Workspace:

| Metric | Where to find it | What it shows |
|--------|-----------------|---------------|
| Portfolio TVL over time | Assets View → TVL Chart | Vault preserves value through volatility |
| Rebalance count | Data Tracking → `rebalanceCount` | Automation is working |
| Drift over time | Data Tracking → `getCurrentDrift()` | Drift kept near zero by rebalancer |
| ETH allocation % | Data Tracking → `getPortfolioValue()` | Target maintained despite price swings |
| Gas per rebalance | Transactions View | Efficiency: ~150k gas per swap |
| Performance vs hold | TVL vs raw ETH price | Rebalancing reduces portfolio volatility |

---

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `targetAllocationBps` | 5000 (50%) | Target ETH share of portfolio |
| `driftThresholdBps` | 500 (5%) | Minimum drift to trigger rebalance |
| `maxSlippageBps` | 100 (1%) | Maximum allowed swap slippage |
| `minRebalanceInterval` | 10 blocks | Minimum blocks between rebalances |
| `POOL_FEE` | 3000 (0.3%) | Uniswap V3 pool fee tier |

Owner can update all parameters (except `POOL_FEE`) via setter functions.

---

## Security

- **ReentrancyGuard** on all state-changing functions
- **SafeERC20** for all ERC20 operations
- **Pausable** emergency stop
- **Chainlink price staleness check** — reverts if price > 1 hour old
- **Slippage protection** on all Uniswap swaps
- **Drift threshold** prevents unnecessary swaps on small movements
- **minRebalanceInterval** prevents sandwich-attack rebalance spam

---

## Running Tests

```bash
npx hardhat test
```

Tests use mock contracts (MockERC20, MockWETH, MockAggregator, MockSwapRouter) for unit testing without a live network.

---

## Hackathon

**Event:** contract.dev Stagenet Hackathon
**Dates:** Feb 27 – Mar 14, 2026
**Track:** DeFi / Smart Contract Systems
**Key differentiator:** The rebalancer's value proposition is only demonstrable with real price data across thousands of blocks — exactly what the contract.dev Stagenet provides.
