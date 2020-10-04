/// SPDX-License-Identifier: MIT-0
pragma solidity ^0.7.2;
pragma experimental ABIEncoderV2;

contract AssetManager {        
    event AssetCreated(Asset asset);
    event OrderPosted(Order order);
    event OrderBought(Order order);
    event OrderSold(Order order);
    event Error(string);

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

    function _cloneOrder(Order memory o) private pure returns (Order memory) {
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

    function _copyOrder(Order memory a, Order memory b) private pure {
        b.id = a.id;
        b.orderType = a.orderType;
        b.seller = a.seller;
        b.buyer = a.buyer;
        b.assetId = a.assetId;
        b.amount = a.amount;
        b.price = a.price;
        b.matched = a.matched;        
    }

    function _validateOrder(OrderRequest memory order) private pure {
        require(order.assetId > 0);
        require(order.amount > 0);
        require(order.price > 0);
    }

    struct Asset {
        uint256 id;
        string name;
        string description;
        uint256 totalQuantity;
        uint256 quantity;
        uint256 decimal;
        address issuer;
        address owner;
    }

    struct AssetRequest {
        string name;
        string description;
        uint256 totalQuantity;
        uint256 decimal;
    }

    function _cloneAsset(Asset memory a) private pure returns (Asset memory) {
        Asset memory newAsset = Asset({
            id: a.id,
            name: a.name,
            description: a.description,
            totalQuantity: a.totalQuantity,
            quantity: a.quantity,
            decimal: a.decimal,
            issuer: a.issuer,
            owner: a.owner
        });

        return newAsset;
    }

    // copy a into b
    function _copyAsset(Asset memory a, Asset memory b) private pure {
        b.id = a.id;
        b.name = a.name;
        b.description = a.description;
        b.totalQuantity = a.totalQuantity;
        b.quantity = a.quantity;
        b.decimal = a.decimal;
        b.issuer = a.issuer;
        b.owner = a.owner;
    }

    function _validateAsset(AssetRequest memory asset) private pure {
        bytes memory b = bytes(asset.name);
        require(b.length > 0);
        require(asset.totalQuantity > 0);
        require(asset.decimal >= 0);
    }

    // Store All Assets. Key is Asset Id
    mapping (uint => Asset) public assets;
    uint lastAssetId;

    // Store All Orders. Key is Order ID
    mapping (uint => Order) public orders;
    uint lastOrderId;
    
    constructor() {
        lastAssetId = 0;
        assets[0] = Asset({
            id: 0,
            name: '__INIT__',
            description: 'INIT ASSET',
            totalQuantity: 0,
            quantity: 0,
            decimal: 0,
            issuer: address(0),
            owner: address(0)
        });

        orders[0] = Order({
            id: 0,
            orderType: OrderType.SELL,
            seller: address(0),
            buyer: address(0),
            assetId: 0,
            amount: 0,
            price: 0,
            matched: true
        });
        lastOrderId = 0;
    }
    
    function createAsset(AssetRequest memory assetRequest) public {
        _validateAsset(assetRequest);  
        uint lai = add(1, lastAssetId);
        Asset memory asset = Asset({
            id: lai,
            name: assetRequest.name,
            description: assetRequest.description,
            totalQuantity: assetRequest.totalQuantity,
            quantity: assetRequest.totalQuantity,
            decimal: assetRequest.decimal,
            issuer: msg.sender,
            owner: msg.sender
        });
        assets[lai] = asset;
        lastAssetId = lai;

        emit AssetCreated(asset);
    } 

    function postOrder(OrderRequest memory orderRequest) public {
        _validateOrder(orderRequest);
        Asset memory asset = assets[orderRequest.assetId];
        if(asset.id == 0) {
            emit Error('Requested asset does not exist');
            revert('Requested asset does not exist');
        }
        address seller;
        address buyer;
        uint loi = add(1, lastOrderId);
        if(orderRequest.orderType == OrderType.BUY) {
            buyer = msg.sender;
            seller = address(0);
        } else {
            buyer =  address(0);            
            seller = msg.sender;            
        }

        Order memory matchingOrder = Order({
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
        //_matchOrder(matchingOrder);        
        emit OrderPosted(matchingOrder);
    }

    function getOrders() public view returns (Order[] memory) {
        Order[] memory allOrders = new Order[](lastOrderId);
        for(uint i = 0; i < lastOrderId; i = add(1, i)) {            
            allOrders[i] = orders[i];
        }

        return allOrders;
    }    

    function getBuyOrders() public returns (Order[] memory) {
        //TODO: Implement
    }        

    function getSellOrders() public returns (Order[] memory) {
        //TODO: Implement
    }

    function getMatchedOrders() public returns (Order[] memory) {
        //TODO: Implement
    }

    function getUserOrders(address user) public returns (Order[] memory) {
        //TODO: Implement
    } 

    function getAssets() public view returns (Asset[] memory) {        
        Asset[] memory allAssets = new Asset[](lastAssetId);
        for(uint i = 0; i < lastAssetId; i = add(1, i)) {
            allAssets[i] = assets[i];
        }
        
        return allAssets;
    } 
    
    function getUserAssets(address user) public view returns (Asset[] memory) {
        Asset[] memory allAssets = new Asset[](lastAssetId);
        for(uint i = 0; i < lastAssetId; i = add(1, i)) {
            if(assets[i].owner == user) {
                allAssets[i] = assets[i];
            }
        }
        
        return allAssets;
    }     

    function getIssuedAssets(address user) public view returns (Asset[] memory) {
        Asset[] memory allAssets = new Asset[](lastAssetId);
        for(uint i = 0; i < lastAssetId; i = add(1, i)) {
            if(assets[i].issuer == user) {
                allAssets[i] = assets[i];
            }
        }
        
        return allAssets;
    }  

    function _matchOrder(Order memory matchingOrder) private {
        //for(uint i = 0; i < lastOrderId; i = i.add(1)) {            
        uint i = 0;
        uint loi = lastOrderId;
        bool matched = false;
        while(i < loi && !matched) {            
            Order memory toMatch = orders[i];
            //if it's the same asset and it's not previously matched
            if(matchingOrder.assetId != toMatch.assetId && toMatch.matched == false) {         
                if(matchingOrder.orderType == OrderType.BUY) {
                    Order memory buyOrder = matchingOrder;
                    Order memory sellOrder = toMatch;

                    matched = _processOrder(buyOrder, sellOrder);
                    matchingOrder = buyOrder;
                } else if(matchingOrder.orderType == OrderType.SELL) {
                    //process sell order
                    Order memory buyOrder = toMatch;
                    Order memory sellOrder = matchingOrder;

                    matched = _processOrder(buyOrder, sellOrder);
                    matchingOrder = sellOrder;
                }
            } else {
                //it's either not the same asset id or the matchingOrder has been previously fully matched
            }
            i = add(1, i);
        }
    }

    function _processOrder(Order memory buyOrder, Order memory sellOrder) private returns (bool matched) {
        matched = false;
        if(buyOrder.price >= sellOrder.price) {
            // check if seller can fufill all the transaction or part of the transaction

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
                emit OrderBought(buyOrder);
                emit OrderSold(sellOrder);
            } else if (buyerAmount > sellerAmount) {
                toBuy = sellerAmount;
                toSell = sellerAmount;
                sellOrder.matched = true;
                buyOrder.amount = sub(buyerAmount, sellerAmount);
                emit OrderSold(sellOrder);
            } else if (buyerAmount < sellerAmount) {
                toBuy = buyerAmount;
                toSell = buyerAmount;
                buyOrder.matched = true;
                matched = true;
                sellOrder.amount = sub(sellerAmount, buyerAmount);
                emit OrderBought(buyOrder);
            }

            Asset memory sellerAsset = _getAsset(sellOrder.seller, sellOrder.assetId);
            Asset memory buyerAsset = _getAsset(buyOrder.buyer, buyOrder.assetId);
            
            
            uint totalCost = mul(toBuy, sellOrder.price);
            uint sellerQuantity = sellerAsset.quantity;
            // check if the user has enough balance to buy the matchingOrder
            if(buyOrder.buyer.balance < totalCost) {
                revert('Your ETH balance is too low for this transaction');
            // does seller have enough asset to sell                        
            } else if(sellerQuantity >= toSell) {
                // transfer toBuy to buyer                            
                uint newBuyerAssetQuantity = add(buyerAsset.quantity, toBuy);
                buyerAsset.quantity = newBuyerAssetQuantity;
                uint buyerId = buyerAsset.id;                            
                assets[buyerId] = buyerAsset;

                // remove toSell from seller                            
                uint newSellerAssetQuantity = sub(sellerAsset.quantity, toSell);
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
    }

    function _getAsset(address owner, uint assetId) private view returns (Asset memory) {   
        Asset memory foundAsset;
        for(uint i = 0; i < lastAssetId; i = add(1, i)) {
            Asset memory asset = assets[i];
            if(asset.owner == owner && asset.id == assetId) {
                return asset;
            } else if(asset.id == assetId) {
                foundAsset = _cloneAsset(asset);
            }
        }

        if(foundAsset.id == 0) {
            revert('Asset with id not found');
        } else {
            foundAsset.owner = owner;
            return foundAsset;
        }
    }

    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x, 'ds-math-add-overflow');
    }

    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x, 'ds-math-sub-underflow');
        require((z = x - y) >= 0, 'ds-math-sub-underflow');
    }

    function mul(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, 'ds-math-mul-overflow');
    }

    function div(uint a, uint b) internal pure returns (uint z) {
        require(b > 0);
        require(a > 0);        
        z = a / b;
    }        
}