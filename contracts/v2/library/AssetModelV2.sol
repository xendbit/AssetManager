/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

library AssetModelV2 {
    // [86438967,"Test Asset","TAX",1000000, 10, "0x94Ce615ca10EFb74cED680298CD7bdB0479940bc"]
    // [86438967,"Test Asset","TAX",1000000, 10, "0x10BFF3ee7d7DFefD613426b787472d4502Ce61b9"]
    // 0xb9295233887bb481E6080088B29ceBfEc942db2B aacount 4
    // 0xf0eB683bb243eCE4Fe94494E4014628AfCb6Efe5 account 3
    // 0xC04915f6b3ff85b50A863eB1FcBF368171539413 account 6 contractor
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


