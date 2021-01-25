/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;
import { OrderModelV2 } from './OrderModelV2.sol';
import "./openzeppelin/SafeMath.sol";

library ConstantsV2 {
    using SafeMath for uint256;
    bytes32 constant PENDING_ORDERS_KEY = keccak256(bytes("PENDING_ORDERS"));
    bytes32 constant BUY_ORDERS_KEY = keccak256(bytes("BUY_ORDERS"));
    bytes32 constant SELL_ORDERS_KEY = keccak256(bytes("SELL_ORDERS"));
    bytes32 constant MATCHED_ORDERS_KEY = keccak256(bytes("MATCHED_ORDERS"));
    bytes32 constant DELETED_ORDERS_KEY = keccak256(bytes("DELETED_ORDERS"));

    uint256 constant MAX_ORDERS_TO_PROCESS = 1000;

    struct Values {
        bool matched;
        bool buyExpired;
        bool sellExpired;
        uint256 toBuy;
        uint256 toSell;
    }

    function binarySearchV2 (
        OrderModelV2.SortedKey[] memory arr,
        int256 low,
        int256 high,
        OrderModelV2.SortedKey memory key) public pure returns (int256) {
        if (high < low) {
            return -1;
        }

        int256 mid = low + (high - low) / 2;//Math.div(Math.add(low, high), 2);
        if (key.date == arr[uint256(mid)].date) {
            return int256(mid);
        }

        if (key.date < arr[uint256(mid)].date) {
            return binarySearchV2(arr, low, (mid - 1), key);
        }

        return binarySearchV2(arr, (mid + 1), high, key);
    }

    function _processOrderSameAmount(
        ConstantsV2.Values memory returnValues, 
        OrderModelV2.Order memory buyOrder, 
        OrderModelV2.Order memory sellOrder) public pure 
    returns (ConstantsV2.Values memory, OrderModelV2.Order memory, OrderModelV2.Order memory) {
        returnValues.toBuy = buyOrder.amountRemaining;
        returnValues.toSell = sellOrder.amountRemaining;
        returnValues.matched = true;
        sellOrder.amountRemaining = 0;
        buyOrder.amountRemaining = 0;

        return(returnValues, buyOrder, sellOrder);
    }    

    function _processOrderBuyPartial(
        ConstantsV2.Values memory returnValues, 
        OrderModelV2.Order memory buyOrder, 
        OrderModelV2.Order memory sellOrder) public pure 
    returns (ConstantsV2.Values memory, OrderModelV2.Order memory, OrderModelV2.Order memory) {
        returnValues.toBuy = sellOrder.amountRemaining;
        returnValues.toSell = sellOrder.amountRemaining;
        buyOrder.amountRemaining = buyOrder.amountRemaining.sub(sellOrder.amountRemaining);
        sellOrder.amountRemaining = 0;
        return(returnValues, buyOrder, sellOrder);
    }

    function _processOrderSellPartial(
        ConstantsV2.Values memory returnValues, 
        OrderModelV2.Order memory buyOrder, 
        OrderModelV2.Order memory sellOrder) public pure 
    returns (ConstantsV2.Values memory, OrderModelV2.Order memory, OrderModelV2.Order memory) {
        returnValues.toBuy = buyOrder.amountRemaining;
        returnValues.toSell = buyOrder.amountRemaining;
        sellOrder.amountRemaining = sellOrder.amountRemaining.sub(buyOrder.amountRemaining);
        buyOrder.amountRemaining = 0;
        return(returnValues, buyOrder, sellOrder);
    }

}
