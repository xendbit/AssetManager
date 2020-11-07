/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

library OrderModel {
    enum OrderType {BUY, SELL}
    // GTC - 0 - Good till cancel
    // AON - 1 - All or None     
    // GTD - 2 - Good till date
    // GTM - 3 - Good till month end
    // MO - 4 - Market Order
    enum OrderStrategy {GTC, AON, GTD, GTM, MO}
    
    enum OrderStatus {NEW, MATCHED, DELETED, EXPIRED}
    
    struct SortedKey {
        bytes32 key;
        uint256 date;
    }

    /**
    This is how the final Ethereum cost will be calculated
    Price must be in wei
    Final Ether cost is now price * amount. Amount must take into consideration the number of decimal places.
    So if you intend to send 200, you must supply 200 * (10**decimals) to the Smart Contract call.
     */
    struct Order {
        SortedKey key;
        OrderType orderType;
        OrderStrategy orderStrategy;
        address seller;
        address buyer;
        string assetName;
        address assetIssuer;
        uint256 amount;
        uint256 originalAmount;
        uint256 price;
        OrderStatus status;
        uint256 orderDate;
        uint256 statusDate;
        uint256 goodUntil;
    }

    // Price must be in wei
    struct OrderRequest {
        OrderType orderType;
        OrderStrategy orderStrategy;
        uint256 amount;
        uint256 price;
        string assetName;
        address assetIssuer;
        uint256 goodUntil;
        bytes32 key; // sha3 of (amount, price, assetName, assetIssuer, time)
    }

    function validateOrder(OrderRequest memory order) public pure {
        require(bytes(order.assetName).length > 0);
        require(order.amount > 0);
        require(order.price > 0);
    }
}