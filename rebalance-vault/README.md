contracts/
├── diamond/
│   ├── Diamond.sol                    # The proxy — delegates calls to facets
│   ├── DiamondCutFacet.sol           # Adds/removes/replaces facets
│   ├── DiamondLoupeFacet.sol         # Introspection (which facets exist)
│   └── OwnershipFacet.sol            # Ownership management
│
├── facets/
│   ├── VaultFacet.sol                # deposit, withdraw, share accounting
│   ├── RebalanceFacet.sol            # checkUpkeep, performUpkeep, swap execution
│   ├── StrategyFacet.sol             # Strategy selection, drift calculation
│   ├── OracleFacet.sol               # Price feeds, staleness checks
│   ├── FeeFacet.sol                  # Management + performance fees
│   ├── GuardFacet.sol                # Circuit breakers, rate limits
│   ├── YieldFacet.sol                # Aave deposit/withdraw for idle assets
│   ├── AdminFacet.sol                # Configuration setters, access control
│   └── ViewFacet.sol                 # All view/getter functions
│
├── storage/
│   └── AppStorage.sol                # Single shared storage struct
│
├── strategies/
│   ├── IRebalanceStrategy.sol        # Strategy interface (external strategies)
│   ├── ThresholdStrategy.sol         # Drift threshold strategy
│   ├── BandStrategy.sol              # Price band strategy
│   └── TWAPStrategy.sol              # Time-weighted strategy
│
├── adapters/
│   ├── ISwapAdapter.sol
│   ├── UniswapV3Adapter.sol
│   ├── IYieldAdapter.sol
│   └── AaveYieldAdapter.sol
│
├── libraries/
│   ├── PortfolioMath.sol
│   ├── SwapMath.sol
│   └── LibDiamond.sol                # Diamond storage and internal functions
│
└── interfaces/
    ├── IDiamondCut.sol
    ├── IDiamondLoupe.sol
    ├── IERC165.sol
    └── ... (external protocol interfaces)