/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

library AssetModelV2 {
    struct AssetRequest {
        uint256 tokenId;
        string name;
        string symbol;                
        uint256 totalQuantity;
        uint256 price;
        address issuer;
    }

    function validateAsset(AssetRequest memory asset) public pure {
        bytes memory b = bytes(asset.name);
        bytes memory b1 = bytes(asset.symbol);
        require(b.length > 0);
        require(b1.length > 0);
        require(asset.tokenId > 0);
        require(asset.totalQuantity > 0);
        require(asset.issuer != address(0));
    }
}
