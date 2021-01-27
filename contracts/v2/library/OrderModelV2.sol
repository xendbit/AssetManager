/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

library OrderModelV2 {
    
    struct SortedKey {
        bytes32 key;
        uint256 date;
    }

    struct Order {
        SortedKey key;
        uint256 orderType;
        uint256 orderStrategy;
        address seller;
        address buyer;
        uint256 tokenId;
        uint256 amountRemaining;
        uint256 originalAmount;
        uint256 price;
        uint256 status;
        uint256 goodUntil;
        uint256 marketType;
    }
    
    // [1, 1, 50, 10, 86438967, 0, "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fae"] -- sell 
    // [1, 1, 150, 10, 86438967, 0, "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad"] -- sell
    // [1, 1, 150, 10, 86438967, 0, "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fac"] -- sell    
    // [0, 0, 350, 10, 86438967, 0, "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01faf"] -- buy
}