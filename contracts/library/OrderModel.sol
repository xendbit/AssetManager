/// SPDX-License-Identifier: MIT-0
pragma solidity ^0.7.2;
pragma experimental ABIEncoderV2;

library OrderModel {
    enum OrderType {BUY, SELL}
    enum OrderStrategy {PARTIAL, ALL_OR_NOTHING}
    
    /**
    This is how the final Ethereum cost will be calculated
    Price must be in wei
    Final Ether cost is now price * amount. Amount must take into consideration the number of decimal places.
    So if you intend to send 200, you must supply 200 * (10**decimals) to the Smart Contract call.
     */
    struct Order {
        uint256 id;
        OrderType orderType;
        OrderStrategy orderStrategy;
        address seller;
        address buyer;
        string assetName;
        uint256 amount;
        uint256 originalAmount;
        uint256 price;
        bool matched;
        uint256 orderDate;
        uint256 matchedDate;
    } 

    // Price must be in wei
    struct OrderRequest {
        OrderType orderType;
        OrderStrategy orderStrategy;
        uint256 amount;
        uint256 price;
        string assetName;
        address assetIssuer;
    }

    function cloneOrder(Order memory o) public pure returns (Order memory) {
        Order memory newOrder = Order({
            id: o.id,
            orderType: o.orderType,
            seller: o.seller,
            buyer: o.buyer,
            assetName: o.assetName,
            amount: o.amount,
            price: o.price,
            matched: o.matched,
            orderStrategy: o.orderStrategy,
            originalAmount: o.originalAmount,
            orderDate: o.orderDate,
            matchedDate: o.matchedDate
        });

        return newOrder;
    }

    function copyOrder(Order memory from) public pure returns (Order memory to) {
        to.id = from.id;
        to.orderType = from.orderType;
        to.orderStrategy = from.orderStrategy;
        to.seller = from.seller;
        to.buyer = from.buyer;
        to.assetName = from.assetName;
        to.amount = from.amount;
        to.price = from.price;
        to.matched = from.matched;        
        to.originalAmount = from.originalAmount;
        to.orderDate = from.orderDate;
        to.matchedDate = from.matchedDate;

        return to;
    }

    function validateOrder(OrderRequest memory order) public pure {
        bytes memory b = bytes(order.assetName);
        require(b.length > 0);
        require(order.amount > 0);
        require(order.price > 0);
    }
}