// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LibDiamond} from "../libraries/LibDiamond.sol";


contract OwnershipFacet {

    /// @notice Returns the current owner of the Diamond
    /// @return owner_ The owner's address
    ///
    /// This is the address that can call diamondCut()
    /// Initially set in the Diamond constructor to the deployer
    function owner() external view returns (address owner_) {
        owner_ = LibDiamond.contractOwner();
    }

    
    function transferOwnership(address _newOwner) external {
        // Only current owner can transfer
        LibDiamond.enforceIsContractOwner();
        
        // Set new owner in DiamondStorage
        LibDiamond.setContractOwner(_newOwner);
    }
}