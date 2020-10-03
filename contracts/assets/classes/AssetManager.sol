/// SPDX-License-Identifier: MIT-0
pragma solidity ^0.7.2;
pragma experimental ABIEncoderV2;

import './SafeMath.sol';
import '../models/Asset.sol';
import '../models/Order.sol';
import '../interfaces/IAssetManager.sol';

contract AssetManager is IAssetManager {
    using SafeMath for uint;
    // Store All Assets. Key is Asset Id
    mapping (uint => AssetModel.Asset) public assets;
    uint lastAssetId;

    // Store All Orders. Key is Order ID
    mapping (uint => OrderModel.Order) public orders;
    uint lastOrderId;
    
    constructor() {
        lastAssetId = 0;
        assets[0] = AssetModel.Asset({
            id: 0,
            name: '__INIT__',
            description: 'INIT ASSET',
            totalQuantity: 0,
            quantity: 0,
            decimal: 0,
            issuer: address(0),
            owner: address(0)
        });

        orders[0] = OrderModel.Order({
            id: 0,
            orderType: OrderModel.OrderType.SELL,
            seller: address(0),
            buyer: address(0),
            assetId: 0,
            amount: 0,
            price: 0,
            matched: true
        });
        lastOrderId = 0;
    }
    
    function createAsset(AssetModel.AssetRequest memory assetRequest) public override {
        AssetModel.validateAsset(assetRequest);  
        uint lai = lastAssetId.add(1);
        AssetModel.Asset memory asset = AssetModel.Asset({
            id: lai,
            name: assetRequest.name,
            description: assetRequest.description,
            totalQuantity: assetRequest.totalQuantity,
            quantity: 0,
            decimal: assetRequest.decimal,
            issuer: msg.sender,
            owner: address(0)

        });
        assets[lai] = asset;
        lastAssetId = lai;

        emit AssetCreated(asset);
    }   

    function postOrder(OrderModel.OrderRequest memory orderRequest) public override {
        OrderModel.validateOrder(orderRequest);
        address seller;
        address buyer;
        uint loi = lastOrderId.add(1);
        if(orderRequest.orderType == OrderModel.OrderType.BUY) {
            buyer = msg.sender;
            seller = address(0);
        } else {
            buyer =  address(0);            
            seller = msg.sender;            
        }

        OrderModel.Order memory matchingOrder = OrderModel.Order({
            id: loi,
            orderType: orderRequest.orderType,
            seller: seller,
            buyer: buyer,
            assetId: orderRequest.assetId,
            amount: orderRequest.amount,
            price: orderRequest.price,
            matched: false

        });

        orders[loi] = matchingOrder;
        lastOrderId = loi;

        // try and match the matchingOrder with previously posted orders
        _matchOrder(matchingOrder);        
        emit OrderPosted(matchingOrder);
    }

    function _matchOrder(OrderModel.Order memory matchingOrder) public override {
        //for(uint i = 0; i < lastOrderId; i = i.add(1)) {            
        uint i = 1;
        uint loi = lastOrderId;
        bool matched = false;
        while(i < loi && !matched) {            
            OrderModel.Order memory toMatch = orders[i];
            //if it's the same asset and it's not previously matched
            if(matchingOrder.assetId != toMatch.assetId && toMatch.matched == false) {         
                if(matchingOrder.orderType == OrderModel.OrderType.BUY) {
                    OrderModel.Order memory buyOrder = matchingOrder;
                    OrderModel.Order memory sellOrder = toMatch;
                    if(buyOrder.price >= sellOrder.price) {
                        // check if seller can fufil all the transaction or part of the transaction

                        uint buyerAmount = buyOrder.amount;
                        uint sellerAmount = sellOrder.amount;

                        uint toBuy;
                        uint toSell;            
                        if(buyerAmount == sellerAmount) {
                            toBuy = buyerAmount;
                            toSell = sellerAmount;
                            buyOrder.matched = true;
                            sellOrder.matched = true;
                            matched = true;
                        } else if (buyerAmount > sellerAmount) {
                            toBuy = sellerAmount;
                            toSell = sellerAmount;
                            sellOrder.matched = true;
                            buyOrder.amount = buyerAmount.sub(sellerAmount);
                        } else if (buyerAmount < sellerAmount) {
                            toBuy = buyerAmount;
                            toSell = buyerAmount;
                            buyOrder.matched = true;
                            matched = true;
                            sellOrder.amount = sellerAmount.sub(buyerAmount);
                        }

                        AssetModel.Asset memory sellerAsset = _getAsset(sellOrder.seller, sellOrder.assetId);
                        AssetModel.Asset memory buyerAsset = _getAsset(buyOrder.buyer, buyOrder.assetId);
                        
                        
                        uint totalCost = toBuy.mul(sellOrder.price);
                        uint sellerQuantity = sellerAsset.quantity;
                        // check if the user has enough balance to buy the matchingOrder
                        if(buyOrder.buyer.balance < totalCost) {
                            revert('Your ETH balance is too low for this transaction');
                        // does seller have enough asset to sell                        
                        } else if(sellerQuantity >= toSell) {
                            // transfer toBuy to buyer                            
                            uint newBuyerAssetQuantity = buyerAsset.quantity.add(toBuy);
                            buyerAsset.quantity = newBuyerAssetQuantity;
                            uint buyerId = buyerAsset.id;                            
                            assets[buyerId] = buyerAsset;

                            // remove toSell from seller                            
                            uint newSellerAssetQuantity = sellerAsset.quantity.sub(toSell);
                            sellerAsset.quantity = newSellerAssetQuantity;
                            uint sellerId = sellerAsset.id;
                            assets[sellerId] = sellerAsset;
                        }
                    } else {
                        //if the price is not witing range.
                    }
                    // update the orders
                    orders[sellOrder.id] = sellOrder;
                    orders[buyOrder.id] = buyOrder;
                    matchingOrder = buyOrder;
                } else if(matchingOrder.orderType == OrderModel.OrderType.SELL) {
                    //process sell order
                }
            } else {
                //it's either not the same asset id or the matchingOrder has been previously fully matched
            }
            i = i.add(1);
        }
    }

    function getOrders() public override view returns (OrderModel.Order[] memory) {
        OrderModel.Order[] memory allOrders = new OrderModel.Order[](lastOrderId);
        for(uint i = 0; i < lastOrderId; i = i.add(1)) {            
            allOrders[i] = orders[i];
        }
    }    

    function getBuyOrders() public override returns (OrderModel.Order[] memory) {
        //TODO: Implement
    }        

    function getSellOrders() public override returns (OrderModel.Order[] memory) {
        //TODO: Implement
    }

    function getMatchedOrders() public override returns (OrderModel.Order[] memory) {
        //TODO: Implement
    }

    function getUserOrders(address user) public override returns (OrderModel.Order[] memory) {
        //TODO: Implement
    } 

    function getAssets() public override view returns (AssetModel.Asset[] memory) {
        AssetModel.Asset[] memory allAssets = new AssetModel.Asset[](lastAssetId);
        for(uint i = 0; i < lastAssetId; i = i.add(1)) {
            allAssets[i] = assets[i];
        }

        return allAssets;
    } 
    
    function getUserAssets(address user) public override view returns (AssetModel.Asset[] memory) {
        AssetModel.Asset[] memory allAssets = new AssetModel.Asset[](lastAssetId);
        for(uint i = 0; i < lastAssetId; i = i.add(1)) {
            AssetModel.Asset memory asset = assets[i];
            if(asset.owner == user) {
                allAssets[i] = asset;
            }
        }

        return allAssets;
    }     

    function getIssuedAssets(address user) public override view returns (AssetModel.Asset[] memory) {
        AssetModel.Asset[] memory allAssets = new AssetModel.Asset[](lastAssetId);
        for(uint i = 0; i < lastAssetId; i = i.add(1)) {
            AssetModel.Asset memory asset = assets[i];
            if(asset.issuer == user) {
                allAssets[i] = asset;
            }
        }

        return allAssets;
    }  

    function _getAsset(address owner, uint assetId) public view returns (AssetModel.Asset memory) {   
        AssetModel.Asset memory foundAsset;
        for(uint i = 0; i < lastAssetId; i = i.add(1)) {
            AssetModel.Asset memory asset = assets[i];
            if(asset.owner == owner && asset.id == assetId) {
                return asset;
            } else if(asset.id == assetId) {
                foundAsset = AssetModel.cloneAsset(asset);
            }
        }

        if(foundAsset.id == 0) {
            revert('Asset with id not found');
        } else {
            foundAsset.owner = owner;
            return foundAsset;
        }
    }
}