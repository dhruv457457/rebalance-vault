// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


interface IDiamondCut {

  
    enum FacetCutAction {
        Add,      // 0 — Register new functions → new facet
        Replace,  // 1 — Point existing functions → different facet
        Remove    
    }

 
    struct FacetCut {
    
        address facetAddress;

        FacetCutAction action;

        bytes4[] functionSelectors;
    }


    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external;
}