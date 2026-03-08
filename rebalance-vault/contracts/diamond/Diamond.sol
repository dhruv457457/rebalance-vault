// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IDiamondCut} from "../interfaces/IDiamondCut.sol";
import {AppStorage} from "../storage/AppStorage.sol";


contract Diamond {

   
    constructor(address _contractOwner, address _diamondCutFacet) payable {
        // Set the Diamond owner
        LibDiamond.setContractOwner(_contractOwner);

        // Register DiamondCutFacet — the bootstrap facet
        // Build a FacetCut to add the diamondCut function
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        
        // The only function we're adding is diamondCut(FacetCut[],address,bytes)
        bytes4[] memory functionSelectors = new bytes4[](1);
        functionSelectors[0] = IDiamondCut.diamondCut.selector;
        
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: _diamondCutFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: functionSelectors
        });
        
        // Execute the cut — registers diamondCut() → DiamondCutFacet
        LibDiamond.diamondCut(cut, address(0), "");
    }


    fallback() external payable {
        // Get DiamondStorage to look up the facet
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        
        // Get the facet address for this function selector
        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;
        
        // If no facet is mapped to this selector, revert
        require(facet != address(0), "Diamond: Function does not exist");

      
        assembly {
            // Copy the entire calldata (function selector + arguments) to memory
            // calldatasize() = total bytes of msg.data
            calldatacopy(0, 0, calldatasize())
            
            // Execute delegatecall to the facet
            // delegatecall(gas, address, inputOffset, inputSize, outputOffset, outputSize)
            // We pass all remaining gas, full calldata, and don't pre-allocate output space
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            
            // Copy the return data to memory
            // returndatasize() = size of data returned by the facet
            returndatacopy(0, 0, returndatasize())
            
            // Either return the data or revert with it
            switch result
            case 0 {
                // delegatecall failed — revert with the facet's revert reason
                revert(0, returndatasize())
            }
            default {
                // delegatecall succeeded — return the facet's return data
                return(0, returndatasize())
            }
        }
    }

  
    receive() external payable {}
}