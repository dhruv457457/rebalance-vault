// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IDiamondCut} from "../interfaces/IDiamondCut.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

/// @title DiamondCutFacet
/// @notice Handles adding, replacing, and removing facets on the Diamond
/// @dev This is the FIRST facet registered (in Diamond's constructor)
///      Without this facet, you can't add any other facets — it's the bootstrap
///
/// SECURITY:
/// - Only the Diamond owner can call diamondCut()
/// - This is the most critical facet — it controls what code the Diamond runs
/// - In production, ownership should be transferred to a multisig or timelock
///
/// USAGE FLOW:
/// 
/// 1. Deploy facets (they're just regular contracts):
///    VaultFacet vaultFacet = new VaultFacet();
///    RebalanceFacet rebalanceFacet = new RebalanceFacet();
///
/// 2. Build cut array:
///    IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](2);
///    cuts[0] = FacetCut(address(vaultFacet), Add, vaultSelectors);
///    cuts[1] = FacetCut(address(rebalanceFacet), Add, rebalanceSelectors);
///
/// 3. Execute cut:
///    IDiamondCut(diamond).diamondCut(cuts, initAddress, initCalldata);
///
/// 4. Now diamond.deposit() routes to VaultFacet
///    And diamond.performUpkeep() routes to RebalanceFacet

contract DiamondCutFacet is IDiamondCut {

    /// @notice Add/replace/remove any number of functions and optionally execute init function
    /// @param _diamondCut Contains the facet addresses and function selectors
    /// @param _init The address of the contract or facet to execute _calldata
    /// @param _calldata A function call, including function selector and arguments
    ///                  _calldata is executed with delegatecall on _init
    ///
    /// EXAMPLES:
    ///
    /// Add a new facet:
    /// diamondCut([{VaultFacet, Add, [deposit,withdraw]}], address(0), "")
    ///
    /// Replace a facet (upgrade):
    /// diamondCut([{VaultFacetV2, Replace, [deposit,withdraw]}], address(0), "")
    ///
    /// Remove functions:
    /// diamondCut([{address(0), Remove, [oldFunction]}], address(0), "")
    ///
    /// Add facet AND initialize it:
    /// diamondCut(
    ///     [{FeeFacet, Add, [setFee,claimFees]}], 
    ///     initContractAddress, 
    ///     abi.encodeCall(init.initialize, (200, 2000))  // sets default fee values
    /// )
    ///
    /// Batch multiple changes in one transaction:
    /// diamondCut([
    ///     {VaultFacet, Add, [deposit,withdraw]},
    ///     {FeeFacet, Add, [setFee,claimFees]},
    ///     {OldFacet, Remove, [deprecatedFunction]}
    /// ], address(0), "")
    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external override {
        // CRITICAL: Only the owner can modify the Diamond
        // Without this check, anyone could add malicious facets
        LibDiamond.enforceIsContractOwner();
        
        // Delegate to LibDiamond which does the actual work
        // (add/replace/remove selectors, update mappings, emit event)
        LibDiamond.diamondCut(_diamondCut, _init, _calldata);
    }
}