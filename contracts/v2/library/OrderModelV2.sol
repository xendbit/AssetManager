/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

library OrderModelV2 {
    enum OrderType {BUY, SELL}
    enum OrderStrategy {
        GOOD_TILL_CANCEL,
        ALL_OR_NONE,
        GOOD_TILL_DATE,
        GOOD_TILL_MONTH,
        MARKET_ORDER
    }

    enum OrderStatus {
        NEW,
        MATCHED,
        DELETED,
        EXPIRED
    }

    struct SortedKey {
        bytes32 key;
        uint256 date;
    }

    struct Order {
        SortedKey key;
        OrderType orderType;
        OrderStrategy orderStrategy;
        address seller;
        address buyer;
        uint256 tokenId;
        uint256 amountRemaining;
        uint256 originalAmount;
        uint256 price;
        OrderStatus status;
        uint256 orderDate;
        uint256 statusDate;
        uint256 goodUntil;
    }
    
    // [1, 0, 100, 10, 86438967, 0, "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fae"]
    struct OrderRequest {
        OrderType orderType;
        OrderStrategy orderStrategy;
        uint256 amount;
        uint256 price;
        uint256 tokenId;
        uint256 goodUntil; // this should be 0 unless if order is GOOD_TILL_DATE or GOOD_TILL_MONTH
        bytes32 key; // sha3 of (amount, price, tokenId, time)
    }
}