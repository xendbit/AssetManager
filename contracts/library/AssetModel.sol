/// SPDX-License-Identifier: MIT-0
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

library AssetModel {
    /**
        totalQuantity is AssetRequest.totalQuantity * (10 ** decimal)
     */
    struct Asset {
        uint256 id;
        string name;
        string description;
        uint256 totalQuantity;
        uint256 quantity;
        uint256 decimal;
        address issuer;
        address owner;
    }

    struct AssetRequest {
        string name;
        string description;
        uint256 totalQuantity;
        uint256 decimal;
    }

    function cloneAsset(Asset memory a) public pure returns (Asset memory) {
        Asset memory newAsset = Asset({
            id: a.id,
            name: a.name,
            description: a.description,
            totalQuantity: a.totalQuantity,
            quantity: a.quantity,
            decimal: a.decimal,
            issuer: a.issuer,
            owner: a.owner
        });

        return newAsset;
    }

    // copy a into b
    function copyAsset(Asset memory a) public pure returns (Asset memory b) {
        b.id = a.id;
        b.name = a.name;
        b.description = a.description;
        b.totalQuantity = a.totalQuantity;
        b.quantity = a.quantity;
        b.decimal = a.decimal;
        b.issuer = a.issuer;
        b.owner = a.owner;

        return b;        
    }

    function validateAsset(AssetRequest memory asset) public pure {
        bytes memory b = bytes(asset.name);
        require(b.length > 0);
        require(asset.totalQuantity > 0);
        require(asset.decimal >= 0);
    }

    function nullAsset() public pure returns (AssetModel.Asset memory) {
        AssetModel.Asset memory asset = AssetModel.Asset({
            id: 0,
            name: '',
            description: '',
            totalQuantity: 0,
            quantity: 0,
            decimal: 0,
            issuer: address(0),
            owner: address(0)
        });

        return asset;
    }

}
