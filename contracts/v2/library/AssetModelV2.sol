/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

library AssetModelV2 {
    // [86438967,"Test Asset","TAX",1000000, 10, "0x94Ce615ca10EFb74cED680298CD7bdB0479940bc"]
    // 0xf0eB683bb243eCE4Fe94494E4014628AfCb6Efe5 - Account 3
    // [86438966,"Test Asset2","TAX2",25000000, 5, "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2"]
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
