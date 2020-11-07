/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import { OrderModel } from './OrderModel.sol';
import { AssetModel } from './AssetModel.sol';

interface IAssetManager {
    event AssetCreated(AssetModel.Asset asset);
    event AssetAlreadyExists(AssetModel.AssetRequest asset);
    event OrderPosted(OrderModel.Order order);
    event OrderBought(OrderModel.Order order);
    event OrderSold(OrderModel.Order order);
    event DEBUG(string str);
    event DEBUG(uint256 str);
    event DEBUG(bool str);
    event DEBUG(OrderModel.SortedKey[] str);    
}
