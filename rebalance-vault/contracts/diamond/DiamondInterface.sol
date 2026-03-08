// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DiamondInterface
/// @notice This is NOT a proxy — it's just an ABI surface
/// so contract.dev can see all facet functions.
/// Deploy this, link it to the Diamond address on the platform.
contract DiamondInterface {
    // From ViewFacet
    function getSharePrice() external view returns (uint256) {}
    function getCurrentDrift() external view returns (int256) {}
    function getPortfolioSummary() external view returns (
        uint256 ethValueUsd,
        uint256 usdcValueUsd,
        uint256 totalUsd,
        int256 currentDrift,
        uint256 targetBps,
        uint256 rebalanceCount,
        uint256 totalShares,
        bool paused
    ) {}
    function getRebalanceStats() external view returns (
        uint256 rebalanceCount,
        uint256 lastRebalanceBlock,
        uint256 lastRebalancePrice,
        uint256 totalVolumeSwapped,
        uint256 totalGasUsed,
        uint256 totalSlippageLost
    ) {}
    
    // From VaultFacet
    function deposit() external payable {}
    function withdraw(uint256 shareAmount) external {}
    
    // From RebalanceFacet
    function performUpkeep(bytes calldata) external {}
    function checkUpkeep(bytes calldata) external view 
        returns (bool upkeepNeeded, bytes memory performData) {}
    
    // From AdminFacet
    function setDriftThreshold(uint256 newBps) external {}
    function pause() external {}
    function unpause() external {}
}