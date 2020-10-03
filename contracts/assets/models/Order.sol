/// SPDX-License-Identifier: MIT-0
pragma solidity ^0.7.2;
pragma experimental ABIEncoderV2;

library OrderModel {
    enum OrderType {BUY, SELL}
    
    struct Order {
        uint256 id;
        OrderType orderType;
        address seller;
        address buyer;
        uint256 assetId;
        uint256 amount;
        uint256 price;
        bool matched;
    }

    struct OrderRequest {
        OrderType orderType;
        uint256 amount;
        uint256 price;
        uint256 assetId;
    }

    function cloneOrder(Order memory o) public pure returns (Order memory) {
        Order memory newOrder = Order({
            id: o.id,
            orderType: o.orderType,
            seller: o.seller,
            buyer: o.buyer,
            assetId: o.assetId,
            amount: o.amount,
            price: o.price,
            matched: o.matched            
        });

        return newOrder;
    }

    function copyOrder(Order memory a, Order memory b) public pure {
        b.id = a.id;
        b.orderType = a.orderType;
        b.seller = a.seller;
        b.buyer = a.buyer;
        b.assetId = a.assetId;
        b.amount = a.amount;
        b.price = a.price;
        b.matched = a.matched;        
    }

    function validateOrder(OrderRequest memory order) public pure {
        require(order.assetId > 0);
        require(order.amount > 0);
        require(order.price > 0);
    }    
}
