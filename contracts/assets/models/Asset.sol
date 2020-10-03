/// SPDX-License-Identifier: MIT-0
pragma solidity ^0.7.2;
pragma experimental ABIEncoderV2;

library AssetModel {
    struct Asset {
        uint256 id;
        bytes32 name;
        bytes32 description;
        uint256 totalQuantity;
        uint256 quantity;
        uint256 decimal;
        address issuer;
        address owner;
    }

    struct AssetRequest {
        bytes32 name;
        bytes32 description;
        uint256 totalQuantity;
        uint256 quantity;
        uint256 decimal;
    }

    struct AssetOrder {
        uint256 assetId;
        uint256 orderId;
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
    function copyAsset(Asset memory a, Asset memory b) public pure {
        b.id = a.id;
        b.name = a.name;
        b.description = a.description;
        b.totalQuantity = a.totalQuantity;
        b.quantity = a.quantity;
        b.decimal = a.decimal;
        b.issuer = a.issuer;
        b.owner = a.owner;
    }

    function validateAsset(AssetRequest memory asset) public pure {
        require(asset.name.length > 0);
        require(asset.totalQuantity > 0);
        require(asset.decimal >= 0);
    }
}