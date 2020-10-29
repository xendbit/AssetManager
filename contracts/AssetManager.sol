/// SPDX-License-Identifier: MIT-0
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { OrderModel } from './library/OrderModel.sol';
import { AssetModel } from './library/AssetModel.sol';
import { Math } from './library/Math.sol';
import { Constants } from './library/Constants.sol';
import { IAssetManager } from './library/IAssetManager.sol';

contract AssetManager is IAssetManager {    
    // Store All Assets. Key is AssetModel.Asset Id
    mapping (uint256 => AssetModel.Asset) assets;
    uint256 lastAssetId;

    // Store All Orders. Key is OrderModel.Order Key
    mapping (bytes32 => OrderModel.Order) orders;
       
    // Store All Orders. Key is hash of keys
    mapping (bytes32 => OrderModel.SortedKey[]) filtered;
    mapping (address => OrderModel.SortedKey[]) userOrders;

    // store NGNC, key is address (ngnc is in wei)
    mapping(address => uint256) ngnc;
    // store NGNC that is tied down by a buy order, key is address
    mapping(address => uint256) escrow;
    
    constructor() {
        lastAssetId = 0;
        ngnc[msg.sender] = 10000000000;
    }

    function transferToken(address toAddress, uint256 amount) external {
        ngnc[msg.sender] = Math.sub(ngnc[msg.sender], amount);
        ngnc[toAddress] = Math.add(ngnc[toAddress], amount);    
    }

    function getTokenBalance() external view returns (uint256){
        return ngnc[msg.sender];
    }

    function getEscrowBalance() external view returns (uint256){
        return escrow[msg.sender];
    }

    function transferAsset(address toAddress, string memory assetName, uint256 amount) external {
        AssetModel.Asset memory senderAsset = _getAssetByNameAndOwner(assetName, msg.sender);
        AssetModel.Asset memory assetToTransfer = _getAssetByNameAndOwner(assetName, toAddress);

        if(senderAsset.quantity >= amount) {            
            if(senderAsset.owner == msg.sender && senderAsset.quantity > amount) {                
                if(assetToTransfer.owner == address(0)) {
                    
                    senderAsset.quantity = Math.sub(senderAsset.quantity, amount);
                    assets[senderAsset.id] = senderAsset;
                    assetToTransfer = AssetModel.Asset({
                        id: lastAssetId,
                        name: assetName,
                        description: senderAsset.description,
                        totalQuantity: senderAsset.totalQuantity,
                        quantity: amount,
                        decimal: senderAsset.decimal,
                        owner: toAddress,
                        issuer: senderAsset.issuer
                    });
                    assets[lastAssetId] = assetToTransfer;     
                    lastAssetId = Math.add(lastAssetId, 1);                    
                } else {
                    senderAsset.quantity = Math.sub(senderAsset.quantity, amount);
                    assetToTransfer.quantity = Math.add(assetToTransfer.quantity, amount);                                    
                    assets[assetToTransfer.id] = assetToTransfer;        
                    assets[senderAsset.id] = senderAsset;
                }            
            } else {
                emit DEBUG("Asset not found");
                return;
            }
        } else {
            emit DEBUG("Asset Not Enough");
            return;
        }
    }
    
    function createAsset(AssetModel.AssetRequest memory ar) external {
        AssetModel.validateAsset(ar);  
        AssetModel.Asset memory existing = _getAssetByNameAndIssuer(ar.name, msg.sender);
        if(existing.issuer != address(0) && existing.owner == msg.sender) {
            emit AssetAlreadyExists(ar);
            emit DEBUG("Asset exists");
            return;
        } else {
            uint256 lai = lastAssetId;
            AssetModel.Asset memory asset = AssetModel.Asset({
                id: lai,
                name: ar.name,
                description: ar.description,
                totalQuantity: ar.totalQuantity,
                quantity: ar.totalQuantity,
                decimal: ar.decimal,
                issuer: msg.sender,
                owner: msg.sender
            });
            assets[lai] = asset;
            lastAssetId = Math.add(1, lastAssetId);

            emit AssetCreated(asset);
        }
    }

    function postOrder(OrderModel.OrderRequest memory or) external payable {
        OrderModel.validateOrder(or);

        AssetModel.Asset memory asset = _getAssetByNameAndIssuer(or.assetName, or.assetIssuer);

        if(asset.issuer == address(0)) {
            emit DEBUG('Asset does not exist');
            return;
        } else {
            address seller;
            address buyer;
            if(or.orderType == OrderModel.OrderType.BUY) {
                uint256 totalCost = Math.mul(or.amount, or.price);
                
                uint256 buyerNgncBalance = ngnc[msg.sender];

                uint256 totalNgncValue = Math.add(buyerNgncBalance, msg.value);

                if(totalNgncValue >= totalCost) {
                    ngnc[msg.sender] = totalNgncValue;
                    ngnc[msg.sender] = Math.sub(ngnc[msg.sender], totalCost);
                    escrow[msg.sender] = Math.add(escrow[msg.sender], totalCost);
                } else {
                    emit DEBUG("Not Enough Ether");
                    return;
                }

                buyer = msg.sender;
                seller = address(0);    
                
                AssetModel.Asset memory buyerAsset = _getAssetByNameAndOwner(or.assetName, msg.sender);                
                if(buyerAsset.owner == address(0)) {                
                    buyerAsset = AssetModel.Asset({
                        id: lastAssetId,
                        name: or.assetName,
                        description: asset.description,
                        totalQuantity: asset.totalQuantity,
                        quantity: 0,
                        decimal: asset.decimal,
                        owner: msg.sender,
                        issuer: asset.issuer                        
                    });
                    assets[lastAssetId] = buyerAsset;     
                    lastAssetId = Math.add(lastAssetId, 1);

                    emit AssetCreated(buyerAsset);
                }

            } else if(or.orderType == OrderModel.OrderType.SELL) {
                buyer =  address(0);            
                seller = msg.sender;            
                //check that you have the asset you want to sell
                AssetModel.Asset memory sellerAsset = _getAssetByNameAndOwner(or.assetName, msg.sender);
                if(sellerAsset.quantity < or.amount) {
                    emit DEBUG('Not Enough Asset');
                    return;
                }            
            }

            OrderModel.SortedKey memory sortedKey = OrderModel.SortedKey({
                key: or.key,
                date: block.timestamp
            });

            OrderModel.Order memory dbOrder = OrderModel.Order({
                key: sortedKey,
                orderType: or.orderType,
                orderStrategy: or.orderStrategy,
                seller: seller,
                buyer: buyer,
                assetName: or.assetName,
                amount: or.amount,
                originalAmount: or.amount,
                price: or.price,
                status: OrderModel.OrderStatus.NEW,
                orderDate: block.timestamp,
                statusDate: block.timestamp,
                goodUntil: or.goodUntil
            });

            orders[or.key] = dbOrder;
                        
            _populateFilteredOrders(dbOrder.key, dbOrder.orderType, dbOrder.buyer, dbOrder.seller);
                       
            emit OrderPosted(dbOrder);
            _matchOrder(dbOrder);
        }
    }

    function cancelOrder(bytes32 key) external {
        _deleteElement(orders[key].key);
    }

    function getOrder(bytes32 key) external view returns (OrderModel.Order memory) {        
        return orders[key];
    }

    function getOrders(string memory key) external view returns (OrderModel.Order[] memory) {        
        OrderModel.SortedKey[] memory orderKeys = filtered[keccak256(bytes(key))];

        OrderModel.Order[] memory allOrders = new OrderModel.Order[](orderKeys.length);
        for(uint256 i = 0; i < orderKeys.length; i++) { 
            allOrders[i] = orders[orderKeys[i].key];
        }
        return allOrders;
    }

    function getUserOrders(address user) external view returns (OrderModel.Order[] memory) {
        uint256 size = userOrders[user].length;

        OrderModel.Order[] memory allOrders = new OrderModel.Order[](size);
        for(uint256 i = 0; i < size; i++) {    
            bytes32 key = userOrders[user][i].key;
            allOrders[i] = orders[key];
        }

        return allOrders;
    } 

    function getAssets() external view returns (AssetModel.Asset[] memory) {        
        AssetModel.Asset[] memory allAssets = new AssetModel.Asset[](lastAssetId);
        for(uint256 i = 0; i < lastAssetId; i++) {
            allAssets[i] = assets[i];
        }
        
        return allAssets;
    } 
    
    function getUserAssets(address user) external view returns (AssetModel.Asset[] memory) {
        AssetModel.Asset[] memory allAssets = new AssetModel.Asset[](lastAssetId);
        for(uint256 i = 0; i < lastAssetId; i++) {
            if(assets[i].owner == user) {
                allAssets[i] = assets[i];
            }
        }
        
        return allAssets;
    } 

    function _matchOrder(OrderModel.Order memory matchingOrder) private {                
        bool matched = false;
        uint256 pendingOrdersSize = filtered[Constants.PENDING_ORDERS_KEY].length;
        if(pendingOrdersSize == 1) {
            return;            
        }

        uint256 k = Math.sub(pendingOrdersSize, 1);
        uint256 end = pendingOrdersSize > Constants.MAX_ORDERS_TO_PROCESS ? Constants.MAX_ORDERS_TO_PROCESS : 0;        

        while(k >= end && matched == false) {
            if(filtered[Constants.PENDING_ORDERS_KEY][k].date != 0) {            
                OrderModel.Order memory toMatch = orders[filtered[Constants.PENDING_ORDERS_KEY][k].key];
                bool assetNameEquals = keccak256(bytes(matchingOrder.assetName)) == keccak256(bytes(toMatch.assetName));
                bool sameType = toMatch.orderType == matchingOrder.orderType;
                bool buyerIsSeller = false;
                if(toMatch.seller != address(0) && matchingOrder.buyer != address(0)) {
                    buyerIsSeller = toMatch.seller == matchingOrder.buyer;
                } else if (toMatch.buyer != address(0) && matchingOrder.seller != address(0)) {
                    buyerIsSeller = toMatch.buyer == matchingOrder.seller;
                }

                bool shouldProcess = assetNameEquals && toMatch.status == OrderModel.OrderStatus.NEW && !sameType && !buyerIsSeller;

                if(shouldProcess) {
                    OrderModel.Order memory buyOrder;
                    OrderModel.Order memory sellOrder;
                    Constants.Values memory returnValues;
                    if(matchingOrder.orderType == OrderModel.OrderType.BUY) {                    
                        buyOrder = matchingOrder;
                        sellOrder = toMatch;
                        returnValues = _processOrder(buyOrder, sellOrder);
                        matched = returnValues.matched;
                        matchingOrder = orders[buyOrder.key.key];                     
                    } else if(matchingOrder.orderType == OrderModel.OrderType.SELL) {                    
                        //copy matchingOrder into sellOrder
                        sellOrder = matchingOrder;                                        
                        buyOrder = toMatch;
                        returnValues = _processOrder(buyOrder, sellOrder);
                        matched = returnValues.matched;
                        matchingOrder = orders[sellOrder.key.key];                    
                    }  

                    if(buyOrder.status == OrderModel.OrderStatus.MATCHED || sellOrder.status == OrderModel.OrderStatus.MATCHED) {
                        AssetModel.Asset memory buyerAsset = _getAssetByNameAndOwner(buyOrder.assetName, buyOrder.buyer);
                        AssetModel.Asset memory sellerAsset = _getAssetByNameAndOwner(sellOrder.assetName, sellOrder.seller);
                                                
                        buyerAsset.quantity = Math.add(buyerAsset.quantity, returnValues.toBuy);
                        assets[buyerAsset.id] = buyerAsset;            
                    
                        sellerAsset.quantity = Math.sub(sellerAsset.quantity, returnValues.toSell);
                        assets[sellerAsset.id] = sellerAsset;                  

                        uint256 totalCost = Math.mul(returnValues.toBuy, buyOrder.price);
                        uint256 toSeller = Math.mul(returnValues.toSell, sellOrder.price);
                        ngnc[sellOrder.seller] = Math.add(ngnc[sellOrder.seller], toSeller);
                        escrow[buyOrder.buyer] = Math.sub(escrow[buyOrder.buyer], toSeller);    
                        // in case the buyer pays less than the price he set, return the balance to buyer                
                        ngnc[buyOrder.buyer] = Math.add(ngnc[buyOrder.buyer], Math.sub(totalCost, toSeller));
                    }
                } 
            }
            if(k == 0) {
                break;
            } else {
                k = Math.sub(k, 1);
            }
        }
    }

    function _processOrder(OrderModel.Order memory buyOrder, OrderModel.Order memory sellOrder) private returns (Constants.Values memory returnValues) {
        returnValues = Constants.Values({
            matched: false,
            buyExpired: false,
            sellExpired: false,
            toBuy: 0,
            toSell: 0
        });

        uint256 buyerAmount = buyOrder.amount;
        uint256 sellerAmount = sellOrder.amount;

                    
        if(buyOrder.goodUntil > 0 && buyOrder.goodUntil < block.timestamp) {
            returnValues.buyExpired = true;
        }
        if(sellOrder.goodUntil > 0 && sellOrder.goodUntil < block.timestamp) {
            returnValues.sellExpired = true;
        }        

        if(buyOrder.price >= sellOrder.price && (returnValues.buyExpired == false && returnValues.sellExpired == false)) {
            if(buyerAmount == sellerAmount) {
                _processOrderSameAmount(returnValues, buyOrder, sellOrder);
            } else if (buyerAmount > sellerAmount && buyOrder.orderStrategy != OrderModel.OrderStrategy.AON) {
                _processOrderBuyPartial(returnValues, buyOrder, sellOrder);
            } else if (buyerAmount < sellerAmount && sellOrder.orderStrategy != OrderModel.OrderStrategy.AON) {
                _processOrderSellPartial(returnValues, buyOrder, sellOrder);
            }            
        } else if(sellOrder.orderStrategy == OrderModel.OrderStrategy.MO && returnValues.sellExpired == false) {
            if(buyerAmount == sellerAmount) {
                _processOrderSameAmount(returnValues, buyOrder, sellOrder);
            } else if (buyerAmount > sellerAmount && buyOrder.orderStrategy != OrderModel.OrderStrategy.AON) {
                _processOrderBuyPartial(returnValues, buyOrder, sellOrder);
            } else if (buyerAmount < sellerAmount && sellOrder.orderStrategy != OrderModel.OrderStrategy.AON) {
                _processOrderSellPartial(returnValues, buyOrder, sellOrder);
            }
        }
 
        orders[sellOrder.key.key] = sellOrder;
        orders[buyOrder.key.key] = buyOrder;        
    }

    function _processOrderSameAmount(Constants.Values memory returnValues, OrderModel.Order memory buyOrder, OrderModel.Order memory sellOrder) private {
        returnValues.toBuy = buyOrder.amount;
        returnValues.toSell = sellOrder.amount;
        returnValues.matched = true;
        sellOrder.amount = 0;
        buyOrder.amount = 0;
        _filterMatchedOrder(buyOrder);
        _filterMatchedOrder(sellOrder);
        emit OrderBought(buyOrder);
        emit OrderSold(sellOrder);        
    }

    function _processOrderBuyPartial(Constants.Values memory returnValues, OrderModel.Order memory buyOrder, OrderModel.Order memory sellOrder) private {
        returnValues.toBuy = sellOrder.amount;
        returnValues.toSell = sellOrder.amount;
        buyOrder.amount = Math.sub(buyOrder.amount, sellOrder.amount);
        sellOrder.amount = 0;
        _filterMatchedOrder(sellOrder);
        emit OrderSold(sellOrder);
    }

    function _processOrderSellPartial(Constants.Values memory returnValues, OrderModel.Order memory buyOrder, OrderModel.Order memory sellOrder) private {
        returnValues.toBuy = buyOrder.amount;
        returnValues.toSell = buyOrder.amount;
        sellOrder.amount = Math.sub(sellOrder.amount, buyOrder.amount);
        buyOrder.amount = 0;
        _filterMatchedOrder(buyOrder);
        emit OrderBought(buyOrder);                        
    }

    function _populateFilteredOrders(OrderModel.SortedKey memory key, OrderModel.OrderType orderType, address buyer, address seller) private {
        filtered[Constants.PENDING_ORDERS_KEY].push(key);    

        if(orderType == OrderModel.OrderType.BUY) {
            filtered[Constants.BUY_ORDERS_KEY].push(key);
            userOrders[buyer].push(key);
        } else {
            filtered[Constants.SELL_ORDERS_KEY].push(key);
            userOrders[seller].push(key);
        }        
    }

    function _filterMatchedOrder(OrderModel.Order memory order) private {
        OrderModel.SortedKey memory key = order.key;  
        _deleteElement(key);
        
        filtered[Constants.MATCHED_ORDERS_KEY].push(order.key);
        order.status = OrderModel.OrderStatus.MATCHED;
        order.statusDate = block.timestamp;                
    }

    function _deleteElement(OrderModel.SortedKey memory key) private { 
        if(filtered[Constants.PENDING_ORDERS_KEY].length == 0) {
            return;
        }

        if(filtered[Constants.PENDING_ORDERS_KEY].length == 1) {
            filtered[Constants.PENDING_ORDERS_KEY].pop();
            return;
        }

        uint256 size = Math.sub(filtered[Constants.PENDING_ORDERS_KEY].length, 1);        
        int256 pos = Constants.binarySearch(filtered[Constants.PENDING_ORDERS_KEY], 0, int256(size), key); 
        
        if (pos >= 0) {
            for(uint256 i = uint256(pos); i < size; i++) {
                filtered[Constants.PENDING_ORDERS_KEY][i] = filtered[Constants.PENDING_ORDERS_KEY][i + 1];
            }
            //delete filtered[Constants.PENDING_ORDERS_KEY][uint256(pos)];
            filtered[Constants.PENDING_ORDERS_KEY].pop();
        }
    }    

    function _getAssetByNameAndOwner(string memory name, address owner) private view returns (AssetModel.Asset memory) {
        for(uint256 i = 0; i < lastAssetId; i++) {
            AssetModel.Asset memory asset = assets[i];
            string memory assetName = asset.name;
            if(keccak256((bytes(assetName))) == keccak256(bytes(name)) && asset.owner == owner) {
                return asset;
            }
        }

        return AssetModel.nullAsset();
    }

    function _getAssetByNameAndIssuer(string memory name, address issuer) private view returns (AssetModel.Asset memory) {
        for(uint256 i = 0; i < lastAssetId; i++) {
            AssetModel.Asset memory asset = assets[i];
            string memory assetName = asset.name;
            if(keccak256((bytes(assetName))) == keccak256(bytes(name)) && asset.issuer == issuer) {
                return asset;
            }
        }

        return AssetModel.nullAsset();
    }
}