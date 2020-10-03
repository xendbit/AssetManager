/// SPDX-License-Identifier: MIT-0
pragma solidity ^0.7.2;
pragma experimental ABIEncoderV2;

import '../models/Asset.sol';
import '../models/Order.sol';

interface IAssetManager {    
    event AssetCreated(AssetModel.Asset asset);
    event OrderPosted(OrderModel.Order order);
    event Bought(OrderModel.Order order);
    event Sold(OrderModel.Order order);

    // creates an asset
    function createAsset(AssetModel.AssetRequest memory assetRequest) external;

    // posts a buy or sell orders
    function postOrder(OrderModel.OrderRequest memory orderRequest) external;

    // match a buy or sell order. This method should only be called internally
    function _matchOrder(OrderModel.Order memory order) external;

    // get all orders
    function getOrders() external returns (OrderModel.Order[] memory);

    // get all orders where Type is buy
    function getBuyOrders() external returns (OrderModel.Order[] memory);

    // get all orders where Type is sell
    function getSellOrders() external returns (OrderModel.Order[] memory);

    // get all orders where natched is true
    function getMatchedOrders() external returns (OrderModel.Order[] memory);

    // get all orders where buyer or seller is user
    function getUserOrders(address user) external returns (OrderModel.Order[] memory);

    // get all assets
    function getAssets() external returns (AssetModel.Asset[] memory);

    // get all assets where owner is user
    function getUserAssets(address user) external returns (AssetModel.Asset[] memory);

    // get all assets where issuer is user
    function getIssuedAssets(address user) external returns (AssetModel.Asset[] memory);
}
