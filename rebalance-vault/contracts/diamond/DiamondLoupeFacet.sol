// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IDiamondLoupe} from "../interfaces/IDiamondLoupe.sol";
import {IERC165} from "../interfaces/IERC165.sol";

/// @title DiamondLoupeFacet
/// @notice Provides introspection functions for the Diamond (EIP-2535)
/// @dev Implements both IDiamondLoupe and IERC165
///
/// WHO CALLS THIS:
/// - Block explorers (to discover available functions)
/// - Frontend apps (to build UI dynamically based on available facets)
/// - Security tools (to verify which facets are installed)
/// - Other contracts (to check compatibility before interacting)
/// - Your deploy scripts (to verify the diamond was set up correctly)
///
/// ALL FUNCTIONS ARE VIEW — they read DiamondStorage, never modify it

contract DiamondLoupeFacet is IDiamondLoupe, IERC165 {

    /// @notice Gets all facets and their function selectors
    /// @return facets_ An array of Facet structs (address + selectors)
    ///
    /// EXAMPLE RETURN for our RebalanceVault Diamond:
    /// [
    ///   { 0xAAA, [diamondCut.selector] },                    // DiamondCutFacet
    ///   { 0xBBB, [facets, facetSelectors, facetAddrs, ...] }, // DiamondLoupeFacet  
    ///   { 0xCCC, [transferOwnership, owner] },                // OwnershipFacet
    ///   { 0xDDD, [deposit, depositUSDC, withdraw, ...] },     // VaultFacet
    ///   { 0xEEE, [checkUpkeep, performUpkeep] },              // RebalanceFacet
    ///   { 0xFFF, [accrueManagementFee, claimFees, ...] },     // FeeFacet
    ///   ...
    /// ]
    ///
    /// This gives a complete picture of the Diamond's capabilities
    function facets() external view override returns (Facet[] memory facets_) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        
        uint256 numFacets = ds.facetAddresses.length;
        facets_ = new Facet[](numFacets);
        
        for (uint256 i; i < numFacets; i++) {
            address facetAddress_ = ds.facetAddresses[i];
            facets_[i].facetAddress = facetAddress_;
            facets_[i].functionSelectors = ds.facetFunctionSelectors[facetAddress_].functionSelectors;
        }
    }

    /// @notice Gets all function selectors supported by a specific facet
    /// @param _facet The facet address to query
    /// @return facetFunctionSelectors_ Array of 4-byte function selectors
    ///
    /// EXAMPLE: facetFunctionSelectors(vaultFacetAddress)
    /// Returns: [
    ///   0xd0e30db0,  // deposit()
    ///   0x6b8ab97d,  // depositUSDC(uint256)
    ///   0x2e1a7d4d,  // withdraw(uint256)
    ///   0xdb006a75,  // emergencyWithdraw()
    /// ]
    ///
    /// USE CASE: Frontend can call this to discover what functions 
    /// VaultFacet exposes, then build UI buttons for each one
    function facetFunctionSelectors(address _facet) 
        external view override returns (bytes4[] memory facetFunctionSelectors_) 
    {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        facetFunctionSelectors_ = ds.facetFunctionSelectors[_facet].functionSelectors;
    }

    /// @notice Gets all facet addresses used by this Diamond
    /// @return facetAddresses_ Array of facet contract addresses
    ///
    /// EXAMPLE: Returns [0xAAA, 0xBBB, 0xCCC, 0xDDD, 0xEEE, 0xFFF, ...]
    /// Each address is a deployed facet contract
    ///
    /// USE CASE: Security audit — verify only expected facets are installed
    /// If you see an unknown address, something is wrong
    function facetAddresses() external view override returns (address[] memory facetAddresses_) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        facetAddresses_ = ds.facetAddresses;
    }

    /// @notice Gets the facet address that handles a specific function selector
    /// @param _functionSelector The 4-byte selector to look up
    /// @return facetAddress_ The facet address, or address(0) if not found
    ///
    /// EXAMPLE: facetAddress(bytes4(keccak256("deposit()")))
    /// Returns: 0xDDD (VaultFacet address)
    ///
    /// EXAMPLE: facetAddress(0xdeadbeef)  // non-existent function
    /// Returns: address(0)
    ///
    /// USE CASE: Debug tool — "which facet is handling my deposit() call?"
    /// If it returns an unexpected address, the Diamond was misconfigured
    function facetAddress(bytes4 _functionSelector) 
        external view override returns (address facetAddress_) 
    {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        facetAddress_ = ds.selectorToFacetAndPosition[_functionSelector].facetAddress;
    }

    /// @notice Query if this contract implements a specific interface
    /// @param _interfaceId The interface identifier (ERC-165)
    /// @return bool True if the interface is supported
    ///
    /// STANDARD INTERFACES OUR DIAMOND SUPPORTS:
    /// - 0x01ffc9a7 → IERC165 (this function itself)
    /// - 0x1f931c1c → IDiamondCut
    /// - 0x48e2b093 → IDiamondLoupe
    ///
    /// These are registered during Diamond deployment (in the init contract)
    ///
    /// WHY THIS MATTERS:
    /// Other contracts can call this before interacting:
    /// if (diamond.supportsInterface(IDiamondCut.interfaceId)) {
    ///     // Safe to call diamondCut on this contract
    /// }
    function supportsInterface(bytes4 _interfaceId) external view override returns (bool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return ds.supportedInterfaces[_interfaceId];
    }
}