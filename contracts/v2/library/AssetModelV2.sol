/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

library AssetModelV2 {
    struct AssetRequest {
        uint256 tokenId;
        string description;
        string symbol;
        uint256 totalSupply;
        uint256 issuingPrice;
        address issuer;
    }

    struct TokenShares {
        uint256 tokenId;
        address owner;
        address sharesContract;
        string description;
        string symbol;
        uint256 totalSupply;
        uint256 issuingPrice;
        address issuer;
    }
}
