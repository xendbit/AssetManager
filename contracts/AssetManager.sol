/// SPDX-License-Identifier: MIT-0
pragma solidity ^0.7.2;
pragma experimental ABIEncoderV2;

import { OrderModel } from './library/OrderModel.sol';
import { AssetModel } from './library/AssetModel.sol';

contract AssetManager {        
    event AssetCreated(AssetModel.Asset asset);
    event AssetAlreadyExists(AssetModel.AssetRequest asset);
    event OrderPosted(OrderModel.Order order);
    event OrderBought(OrderModel.Order order);    
    event OrderSold(OrderModel.Order order);
    event DEBUG(string str);
    event DEBUG(uint256 str);
    event DEBUG(address str);
    event DEBUG(bool str);

    uint256 ONE_WEI = 1000000000000000000;

    // Store All Assets. Key is AssetModel.Asset Id
    mapping (uint256 => AssetModel.Asset) public assets;
    uint256 lastAssetId;

    // Store All Orders. Key is OrderModel.Order ID
    mapping (uint256 => OrderModel.Order) public orders;
    uint256 lastOrderId;

    // store NGNC, key is address (ngnc is in wei)
    mapping(address => uint256) ngnc;
    // store NGNC that is tied down by a buy order, key is address
    mapping(address => uint256) escrow;
    
    constructor() {
        lastAssetId = 0;

        ngnc[msg.sender] = 2**250;
        
        lastOrderId = 0;
    }

    // TODO: Test this method
    function transferToken(address toAddress, uint256 amount) public {
        uint256 senderAmount = ngnc[msg.sender];
        senderAmount = sub(senderAmount, amount);
        uint256 recieverAmount = ngnc[toAddress];
        recieverAmount = add(recieverAmount, amount);    
        ngnc[msg.sender] = senderAmount;
        ngnc[toAddress] = recieverAmount;
    }

    function getTokenBalance() public view returns (uint256){
        return ngnc[msg.sender];
    }

    function getEscrowBalance() public view returns (uint256){
        return escrow[msg.sender];
    }

    function transferAsset(address toAddress, string memory assetName, uint256 amount) public {
        AssetModel.Asset memory senderAsset = _getAssetByNameAndOwner(assetName, msg.sender);
        AssetModel.Asset memory assetToTransfer = _getAssetByNameAndOwner(assetName, toAddress);

        if(senderAsset.quantity >= amount) {            
            if(senderAsset.owner == msg.sender && senderAsset.quantity > amount) {                
                if(assetToTransfer.owner == address(0)) {
                    // create an asset for the user
                    senderAsset.quantity = sub(senderAsset.quantity, amount);
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
                    lastAssetId = add(lastAssetId, 1);                    
                } else {
                    senderAsset.quantity = sub(senderAsset.quantity, amount);
                    assetToTransfer.quantity = add(assetToTransfer.quantity, amount);                                    
                    assets[assetToTransfer.id] = assetToTransfer;        
                    assets[senderAsset.id] = senderAsset;
                }            
            } else {
                emit DEBUG("AssetModel.Asset not found or you don't have enough to transfer");
                return;
            }
        } else {
            emit DEBUG("Sender doesn't have enough assets to transfer");
            return;
        }
    }
    
    function createAsset(AssetModel.AssetRequest memory assetRequest) public {
        AssetModel.validateAsset(assetRequest);  
        AssetModel.Asset memory existing = _getAssetByName(assetRequest.name);
        if(existing.issuer != address(0) && existing.owner == msg.sender) {
            emit AssetAlreadyExists(assetRequest);
            emit DEBUG("AssetModel.Asset with name already exists for sender");
            return;
        } else {
            uint256 lai = lastAssetId;
            uint256 totalQuantity = assetRequest.totalQuantity;
            AssetModel.Asset memory asset = AssetModel.Asset({
                id: lai,
                name: assetRequest.name,
                description: assetRequest.description,
                totalQuantity: totalQuantity,
                quantity: totalQuantity,
                decimal: assetRequest.decimal,
                issuer: msg.sender,
                owner: msg.sender
            });
            assets[lai] = asset;
            lastAssetId = add(1, lastAssetId);

            emit AssetCreated(asset);
        }
    } 

    function postOrder(OrderModel.OrderRequest memory orderRequest) public payable {
        OrderModel.validateOrder(orderRequest);

        AssetModel.Asset memory asset = _getAssetByNameAndIssuer(orderRequest.assetName, orderRequest.assetIssuer);

        if(asset.issuer == address(0)) {
            emit DEBUG('Requested asset does not exist');
            return;
        } else {
            address seller;
            address buyer;
            uint256 loi = lastOrderId;
            if(orderRequest.orderType == OrderModel.OrderType.BUY) {
                //does the buyer send enough ether to cover the transaction
                uint256 value = msg.value;
                uint256 totalCost = mul(orderRequest.amount, orderRequest.price);
                
                uint256 buyerNgncBalance = ngnc[msg.sender];

                uint256 totalNgncValue = add(buyerNgncBalance, value);

                if(totalNgncValue >= totalCost) {
                    ngnc[msg.sender] = totalNgncValue;
                    ngnc[msg.sender] = sub(ngnc[msg.sender], totalCost);
                    escrow[msg.sender] = add(escrow[msg.sender], totalCost);
                } else {
                    emit DEBUG("Ether sent is not enough to cover the costs of the BUY request");
                    return;
                }

                buyer = msg.sender;
                seller = address(0);    
                // if this buyer doesn't have this asset, create one for them
                AssetModel.Asset memory buyerAsset = _getAssetByNameAndOwner(orderRequest.assetName, msg.sender);                
                if(buyerAsset.owner == address(0)) {                
                    buyerAsset = AssetModel.Asset({
                        id: lastAssetId,
                        name: orderRequest.assetName,
                        description: asset.description,
                        totalQuantity: asset.totalQuantity,
                        quantity: 0,
                        decimal: asset.decimal,
                        owner: msg.sender,
                        issuer: asset.issuer                        
                    });
                    assets[lastAssetId] = buyerAsset;     
                    lastAssetId = add(lastAssetId, 1);

                    emit AssetCreated(buyerAsset);
                }

            } else if(orderRequest.orderType == OrderModel.OrderType.SELL) {
                buyer =  address(0);            
                seller = msg.sender;            
                //check that you have the asset you want to sell
                AssetModel.Asset memory sellerAsset = _getAssetByNameAndOwner(orderRequest.assetName, msg.sender);
                if(sellerAsset.quantity < orderRequest.amount) {
                    emit DEBUG('You do not have enough of the asset to cover the sale');
                    return;
                }            
            }

            OrderModel.Order memory dbOrder = OrderModel.Order({
                id: loi,
                orderType: orderRequest.orderType,
                orderStrategy: orderRequest.orderStrategy,
                seller: seller,
                buyer: buyer,
                assetName: orderRequest.assetName,
                amount: orderRequest.amount,
                originalAmount: orderRequest.amount,
                price: orderRequest.price,
                matched: false
            });

            orders[loi] = dbOrder;
            lastOrderId = add(1, lastOrderId);

            // try and match the matchingOrder with previously posted orders                    
            OrderModel.Order memory matchingOrder = OrderModel.copyOrder(dbOrder);
            emit OrderPosted(matchingOrder);
            _matchOrder(matchingOrder, loi);
        }
    }

    function getOrders() public view returns (OrderModel.Order[] memory) {
        OrderModel.Order[] memory allOrders = new OrderModel.Order[](lastOrderId);
        for(uint256 i = 0; i < lastOrderId; i = add(1, i)) {            
            allOrders[i] = orders[i];
        }

        return allOrders;
    }    

    function getBuyOrders() public view returns (OrderModel.Order[] memory) {
        OrderModel.Order[] memory allOrders = new OrderModel.Order[](lastOrderId);
        for(uint256 i = 0; i < lastOrderId; i = add(1, i)) {    
            if(orders[i].orderType == OrderModel.OrderType.BUY) {
                allOrders[i] = orders[i];
            }
        }

        return allOrders;
    }        

    function getSellOrders() public view returns (OrderModel.Order[] memory) {
        OrderModel.Order[] memory allOrders = new OrderModel.Order[](lastOrderId);
        for(uint256 i = 0; i < lastOrderId; i = add(1, i)) {    
            if(orders[i].orderType == OrderModel.OrderType.SELL) {
                allOrders[i] = orders[i];
            }
        }

        return allOrders;
    }

    function getMatchedOrders() public view returns (OrderModel.Order[] memory) {
        OrderModel.Order[] memory allOrders = new OrderModel.Order[](lastOrderId);
        for(uint256 i = 0; i < lastOrderId; i = add(1, i)) {    
            if(orders[i].matched) {
                allOrders[i] = orders[i];
            }
        }

        return allOrders;
    }

    function getUserOrders(address user) public view returns (OrderModel.Order[] memory) {
        OrderModel.Order[] memory allOrders = new OrderModel.Order[](lastOrderId);
        for(uint256 i = 0; i < lastOrderId; i = add(1, i)) {    
            if(orders[i].buyer == user || orders[i].seller == user) {
                allOrders[i] = orders[i];
            }
        }

        return allOrders;
    } 

    function getAssets() public view returns (AssetModel.Asset[] memory) {        
        AssetModel.Asset[] memory allAssets = new AssetModel.Asset[](lastAssetId);
        for(uint256 i = 0; i < lastAssetId; i = add(1, i)) {
            allAssets[i] = assets[i];
        }
        
        return allAssets;
    } 
    
    function getUserAssets(address user) public view returns (AssetModel.Asset[] memory) {
        AssetModel.Asset[] memory allAssets = new AssetModel.Asset[](lastAssetId);
        for(uint256 i = 0; i < lastAssetId; i = add(1, i)) {
            if(assets[i].owner == user) {
                allAssets[i] = assets[i];
            }
        }
        
        return allAssets;
    }     

    function getIssuedAssets(address user) public view returns (AssetModel.Asset[] memory) {
        AssetModel.Asset[] memory allAssets = new AssetModel.Asset[](lastAssetId);
        for(uint256 i = 0; i < lastAssetId; i = add(1, i)) {
            if(assets[i].issuer == user) {
                allAssets[i] = assets[i];
            }
        }
        
        return allAssets;
    }  

    function _matchOrder(OrderModel.Order memory matchingOrder, uint256 loi) private {        
        uint256 i = 0;        
        bool matched = false;
        uint256 toBuy = 0;
        uint256 toSell = 0;
        //AssetModel.Asset memory asset = assets[matchingOrder.assetId];
        while(i < loi && matched == false) {       
            OrderModel.Order memory toMatch = orders[i];
            bool assetNameEquals = keccak256(bytes(matchingOrder.assetName)) == keccak256(bytes(toMatch.assetName));
            bool sameType = toMatch.orderType == matchingOrder.orderType;
            bool buyerIsSeller = false;
            if(toMatch.seller != address(0) && matchingOrder.buyer != address(0)) {
                buyerIsSeller = toMatch.seller == matchingOrder.buyer;
            } else if (toMatch.buyer != address(0) && matchingOrder.seller != address(0)) {
                buyerIsSeller = toMatch.buyer == matchingOrder.seller;
            }

            bool shouldProcess = assetNameEquals && !toMatch.matched && !sameType && !buyerIsSeller;

            if(shouldProcess) {               

                if(matchingOrder.orderType == OrderModel.OrderType.BUY) {
                    
                    //copy matchingOrder into buyOrder
                    OrderModel.Order memory buyOrder = OrderModel.copyOrder(matchingOrder);

                    // match buy to sell
                    // 1. Copy toMatch into sellOrder
                    // 2. Process the order
                    // 3. Copy updated buyOrder into matchingOrder
                    
                    OrderModel.Order memory sellOrder = OrderModel.copyOrder(toMatch);
                    if(sellOrder.orderType == OrderModel.OrderType.SELL) {
                        (matched, toBuy, toSell) = _processOrder(buyOrder, sellOrder);
                        if(matched) {
                            // transfer money from escrow of buyer to seller
                            uint256 totalCost = mul(toBuy, buyOrder.price);
                            uint256 sellerBalance = ngnc[sellOrder.seller];
                            uint256 buyerBalance = escrow[buyOrder.buyer];
                            ngnc[sellOrder.seller] = add(sellerBalance, totalCost);
                            escrow[buyOrder.buyer] = sub(buyerBalance, totalCost);                    
                        }                        
                        matchingOrder = OrderModel.copyOrder(orders[buyOrder.id]);
                    }                    
                } else if(matchingOrder.orderType == OrderModel.OrderType.SELL) {
                    
                    //copy matchingOrder into sellOrder
                    OrderModel.Order memory sellOrder = OrderModel.copyOrder(matchingOrder);
                    
                    // match sell to buy
                    // 1. Copy toMatch into buyOrder
                    // 2. Process the order
                    // 3. Copy updated sellOrder into matchingOrder
                    
                    OrderModel.Order memory buyOrder = OrderModel.copyOrder(toMatch);
                    if(buyOrder.orderType == OrderModel.OrderType.BUY) {
                        (matched, toBuy, toSell) = _processOrder(buyOrder, sellOrder);
                        if(matched) {
                            // transfer money from escrow of buyer to seller
                            uint256 totalCost = mul(toBuy, buyOrder.price);
                            uint256 sellerBalance = ngnc[sellOrder.seller];
                            uint256 buyerBalance = escrow[buyOrder.buyer];
                            ngnc[sellOrder.seller] = add(sellerBalance, totalCost);
                            escrow[buyOrder.buyer] = sub(buyerBalance, totalCost);                    
                        }                        
                        matchingOrder = OrderModel.copyOrder(orders[sellOrder.id]);
                    }
                }                
            } else {
                //it's either not the same asset id or the matchingOrder has been previously fully matched
            }
            i = add(1, i);
        }
    }

    function _processOrder(OrderModel.Order memory buyOrder, OrderModel.Order memory sellOrder) private returns (bool matched, uint256 toBuy, uint256 toSell) {
        matched = false;
        if(buyOrder.price >= sellOrder.price) {
            // check if seller can fufill all the transaction or part of the transaction
            uint256 buyerAmount = buyOrder.amount;
            uint256 sellerAmount = sellOrder.amount;

            // uint256 toBuy;
            // uint256 toSell;  
            AssetModel.Asset memory buyerAsset = _getAssetByNameAndOwner(buyOrder.assetName, buyOrder.buyer);
            AssetModel.Asset memory sellerAsset = _getAssetByNameAndOwner(sellOrder.assetName, sellOrder.seller);
                        
            if(buyerAmount == sellerAmount) {
                // Either the strategy is all or nothing or it is partial, run this code
                toBuy = buyerAmount;
                toSell = sellerAmount;
                buyOrder.matched = true;
                sellOrder.matched = true;
                matched = true;
                sellOrder.amount = 0;
                buyOrder.amount = 0;
                emit OrderBought(buyOrder);
                emit OrderSold(sellOrder);
            } else if (buyerAmount > sellerAmount && buyOrder.orderStrategy == OrderModel.OrderStrategy.PARTIAL) {
                toBuy = sellerAmount;
                toSell = sellerAmount;
                sellOrder.matched = true;
                buyOrder.amount = sub(buyerAmount, sellerAmount);
                sellOrder.amount = 0;
                emit OrderSold(sellOrder);
            } else if (buyerAmount < sellerAmount && sellOrder.orderStrategy == OrderModel.OrderStrategy.PARTIAL) {
                toBuy = buyerAmount;
                toSell = buyerAmount;
                buyOrder.matched = true;
                sellOrder.amount = sub(sellerAmount, buyerAmount);
                buyOrder.amount = 0;
                emit OrderBought(buyOrder);                
            }
            
            if(buyOrder.matched == true || sellOrder.matched == true) {
                // transfer toBuy to buyer                            
                uint256 newBuyerAssetQuantity = add(buyerAsset.quantity, toBuy);
                buyerAsset.quantity = newBuyerAssetQuantity;
                uint256 buyerId = buyerAsset.id;                            
                assets[buyerId] = buyerAsset;            

                // remove toSell from seller                            
                uint256 newSellerAssetQuantity = sub(sellerAsset.quantity, toSell);
                sellerAsset.quantity = newSellerAssetQuantity;
                uint256 sellerId = sellerAsset.id;
                assets[sellerId] = sellerAsset;
            }
        } else {
            //if the price is not witing range.
        }
        // update the orders
        orders[sellOrder.id] = sellOrder;
        orders[buyOrder.id] = buyOrder;        
    }

    function _getAssetByName(string memory name) private view returns (AssetModel.Asset memory) {
        for(uint256 i = 0; i < lastAssetId; i = add(1, i)) {
            AssetModel.Asset memory asset = assets[i];
            string memory assetName = asset.name;
            if(keccak256((bytes(assetName))) == keccak256(bytes(name))) {
                return asset;
            }
        }

        //return _nullAsset();
    }

    function _getAssetByNameAndOwner(string memory name, address owner) private view returns (AssetModel.Asset memory) {
        for(uint256 i = 0; i < lastAssetId; i = add(1, i)) {
            AssetModel.Asset memory asset = assets[i];
            string memory assetName = asset.name;
            if(keccak256((bytes(assetName))) == keccak256(bytes(name)) && asset.owner == owner) {
                return asset;
            }
        }

        //return _nullAsset();
    }

    function _getAssetByNameAndIssuer(string memory name, address issuer) private view returns (AssetModel.Asset memory) {
        for(uint256 i = 0; i < lastAssetId; i = add(1, i)) {
            AssetModel.Asset memory asset = assets[i];
            string memory assetName = asset.name;
            if(keccak256((bytes(assetName))) == keccak256(bytes(name)) && asset.issuer == issuer) {
                return asset;
            }
        }

        return _nullAsset();
    }

    function _nullAsset() private pure returns (AssetModel.Asset memory) {
        AssetModel.Asset memory asset = AssetModel.Asset({
            id: 0,
            name: '',
            description: '',
            totalQuantity: 0,
            quantity: 0,
            decimal: 0,
            issuer: address(0),
            owner: address(0)
        });

        return asset;
    }

    function add(uint256 x, uint256 y) private pure returns (uint256 z) {
        require((z = x + y) >= x, 'ds-math-add-overflow');
    }

    function sub(uint256 x, uint256 y) private pure returns (uint256 z) {
        require((z = x - y) <= x, 'ds-math-sub-underflow');
        require((z = x - y) >= 0, 'ds-math-sub-underflow');
    }

    function mul(uint256 x, uint256 y) private pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x, 'ds-math-mul-overflow');
    }

    function div(uint256 a, uint256 b) private pure returns (uint256 z) {
        require(b > 0);
        require(a > 0);        
        z = a / b;
    }
}