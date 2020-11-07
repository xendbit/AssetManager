/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
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
        uint256 price;
        uint256 decimal;
        address issuer;
        address owner;
    }

    struct AssetRequest {
        string name;
        string description;
        uint256 totalQuantity;
        uint256 price;
        uint256 decimal;
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
            price: 0,
            quantity: 0,
            decimal: 0,
            issuer: address(0),
            owner: address(0)
        });

        return asset;
    }

}
