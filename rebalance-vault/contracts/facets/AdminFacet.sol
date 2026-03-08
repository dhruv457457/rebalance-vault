// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AppStorage, appStorage} from "../storage/AppStorage.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract AdminFacet {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    event RoleGranted(bytes32 indexed role, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed account);
    event VaultPaused(address indexed by);
    event VaultUnpaused(address indexed by);
    event ConfigUpdated(string param, uint256 value);

    function grantRole(bytes32 role, address account) external {
        LibDiamond.enforceIsContractOwner();
        AppStorage storage s = appStorage();
        s.roles[role][account] = true;
        emit RoleGranted(role, account);
    }

    function revokeRole(bytes32 role, address account) external {
        LibDiamond.enforceIsContractOwner();
        AppStorage storage s = appStorage();
        s.roles[role][account] = false;
        emit RoleRevoked(role, account);
    }

    function hasRole(bytes32 role, address account) external view returns (bool) {
        return appStorage().roles[role][account];
    }

    function setTargetAllocation(uint256 newBps) external {
        LibDiamond.enforceIsContractOwner();
        require(newBps <= 10_000, "AdminFacet: Invalid BPS");
        appStorage().targetAllocationBps = newBps;
        emit ConfigUpdated("targetAllocationBps", newBps);
    }

    function setDriftThreshold(uint256 newBps) external {
        LibDiamond.enforceIsContractOwner();
        require(newBps > 0 && newBps <= 5000, "AdminFacet: Invalid BPS");
        appStorage().driftThresholdBps = newBps;
        emit ConfigUpdated("driftThresholdBps", newBps);
    }

    function setMaxSlippage(uint256 newBps) external {
        LibDiamond.enforceIsContractOwner();
        require(newBps > 0 && newBps <= 1000, "AdminFacet: Invalid BPS");
        appStorage().maxSlippageBps = newBps;
        emit ConfigUpdated("maxSlippageBps", newBps);
    }

    function setMinRebalanceInterval(uint256 blocks) external {
        LibDiamond.enforceIsContractOwner();
        appStorage().minRebalanceInterval = blocks;
        emit ConfigUpdated("minRebalanceInterval", blocks);
    }

    function setSwapAdapter(address _adapter) external {
        LibDiamond.enforceIsContractOwner();
        require(_adapter != address(0), "AdminFacet: Zero address");
        appStorage().swapAdapter = _adapter;
    }

    function pause() external {
        LibDiamond.enforceIsContractOwner();
        appStorage().paused = true;
        emit VaultPaused(msg.sender);
    }

    function unpause() external {
        LibDiamond.enforceIsContractOwner();
        appStorage().paused = false;
        emit VaultUnpaused(msg.sender);
    }

    function initializeVault(
        address _priceFeed,
        address _usdc,
        address _weth,
        address _swapRouter,
        uint256 _targetAllocationBps,
        uint256 _driftThresholdBps,
        uint256 _maxSlippageBps,
        uint256 _minRebalanceInterval
    ) external {
        LibDiamond.enforceIsContractOwner();
        AppStorage storage s = appStorage();

        require(s.priceFeed == address(0), "AdminFacet: Already initialized");

        s.priceFeed = _priceFeed;
        s.usdc = _usdc;
        s.weth = _weth;
        s.swapRouter = _swapRouter;
        s.targetAllocationBps = _targetAllocationBps;
        s.driftThresholdBps = _driftThresholdBps;
        s.maxSlippageBps = _maxSlippageBps;
        s.minRebalanceInterval = _minRebalanceInterval;
        s.lastFeeTimestamp = block.timestamp;
    }
}
