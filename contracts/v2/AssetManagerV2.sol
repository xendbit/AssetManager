/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "./library/openzeppelin/ERC721.sol";
import "./ShareContract.sol";
import "./library/AssetModelV2.sol";
import "./library/OrderModelV2.sol";
import "./library/ConstantsV2.sol";
import "./library/openzeppelin/SafeMath.sol";

contract AssetManagerV2 is ERC721("NSE Art Exchange", "ARTX") {
    using SafeMath for uint256;
    mapping(uint256 => ShareContract) shares;

    ShareContract wallet;

    // Store All Orders. Key is OrderModelV2.Order Key
    mapping(bytes32 => OrderModelV2.Order) orders;

    // Store All Orders. Key is hash of keys
    mapping(bytes32 => OrderModelV2.SortedKey[]) filtered;
    mapping(address => OrderModelV2.SortedKey[]) userOrders;

    address owner;

    // store xether that is tied down by a buy order, key is address
    mapping(address => uint256) escrow;

    constructor() public {
        owner = msg.sender;
        wallet = new ShareContract("Tether Token", "WALLET", 10**12, 1, msg.sender);
    }

    function walletBalance(address userAddress) external view returns (uint256) {
        return wallet.allowance(userAddress, address(this));
    }

    function ownedShares(uint256 tokenId, address userAddress) external view returns (uint256) {
        ShareContract shareContract = shares[tokenId];
        return shareContract.allowance(userAddress, address(this));
    }

    function postOrder(OrderModelV2.OrderRequest calldata or) external {
        require(or.tokenId > 0);
        require(or.amount > 0);
        require(or.price > 0);

        address seller;
        address buyer;
        if (or.orderType == OrderModelV2.OrderType.BUY) {
            buyer = msg.sender;
            seller = address(0);
            uint256 totalCost = or.amount.mul(or.price);
            uint256 buyerNgncBalance = wallet.allowance(buyer, address(this));

            if (buyerNgncBalance >= totalCost) {
                // deduct totalCost from wallet
                _updateWalletBalance(buyer, totalCost, false);
                // update escrow
                escrow[buyer] = escrow[buyer].add(totalCost);
            } else {
                revert("LB");
            }
        } else if (or.orderType == OrderModelV2.OrderType.SELL) {
            buyer = address(0);
            seller = msg.sender;
            //check that you have the asset you want to sell
            ShareContract shareContract = shares[or.tokenId];
            uint256 sellerShares = shareContract.allowance(seller, address(this));

            if (sellerShares < or.amount) {
                revert("NEA");
            } else {
                // escrow it
                if(shareContract.transferFrom(seller, owner, or.amount)) {
                    shareContract.allow(owner, or.amount);
                }
            }
        }

        OrderModelV2.SortedKey memory sortedKey = OrderModelV2.SortedKey({ key: or.key, date: block.timestamp });

        OrderModelV2.Order memory dbOrder = OrderModelV2.Order({
            key: sortedKey,
            orderType: or.orderType,
            orderStrategy: or.orderStrategy,
            seller: seller,
            buyer: buyer,
            tokenId: or.tokenId,
            amountRemaining: or.amount,
            originalAmount: or.amount,
            price: or.price,
            status: OrderModelV2.OrderStatus.NEW,
            orderDate: block.timestamp,
            statusDate: block.timestamp,
            goodUntil: or.goodUntil
        });

        orders[or.key] = dbOrder;

        _populateFilteredOrders(dbOrder.key, dbOrder.orderType, dbOrder.buyer, dbOrder.seller);

        _matchOrder(dbOrder);
    }

    function getOrder(bytes32 key) external view returns (OrderModelV2.Order memory) {
        return orders[key];
    }

    function mint(AssetModelV2.AssetRequest calldata ar) external {
        bytes memory b = bytes(ar.description);
        bytes memory b1 = bytes(ar.symbol);
        require(b.length > 0);
        require(b1.length > 0);
        require(ar.tokenId > 0);
        require(ar.totalSupply > 0);
        require(ar.issuer != address(0));
        require(owner == msg.sender);
        _safeMint(msg.sender, ar.tokenId);
        // create an ERC20 Smart contract and assign the shares to issuer
        ShareContract shareContract = new ShareContract(
            ar.description,
            ar.symbol,
            ar.totalSupply,
            ar.issuingPrice,
            ar.issuer
        );
        shares[ar.tokenId] = shareContract;
    }

    // function transferShares(uint256 tokenId, address recipient, uint256 amount) external {
    //     shares[tokenId].transferFrom(msg.sender, recipient, amount);
    //     // Allow this contract to spend on recipients behalf
    //     shares[tokenId].allow(recipient, amount);
    // }

    // function transferTokenOwnership(uint256 tokenId, address recipient) external {
    //     uint256 sharesOwned = shares[tokenId].allowance(
    //         msg.sender,
    //         address(this)
    //     );

    //     // first transfer the shares owned by the caller in tokenId
    //     shares[tokenId].transferFrom(msg.sender, recipient, sharesOwned);
    //     shares[tokenId].allow(recipient, sharesOwned);
    //     // then transfer ownership of the token
    //     safeTransferFrom(msg.sender, recipient, tokenId);
    // }

    function fundWallet(address recipient, uint256 amount) external {
        require(owner == msg.sender, 'OF');
        wallet.transferFrom(msg.sender, recipient, amount);
        // Allow this contract to spend on recipients behalf
        wallet.allow(recipient, amount);
    }

    function tokenShares(uint256 tokenId) external view returns (AssetModelV2.TokenShares memory) {
        address tokenOwner = ownerOf(tokenId);

        ShareContract shareContract = shares[tokenId];
        (
            address sharesContract,
            string memory description,
            string memory symbol,
            uint256 totalSupply,
            uint256 issuingPrice,
            address issuer
        ) = shareContract.details();

        return AssetModelV2.TokenShares({
                tokenId: tokenId,
                owner: tokenOwner,
                sharesContract: sharesContract,
                description: description,
                symbol: symbol,
                totalSupply: totalSupply,
                issuingPrice: issuingPrice,
                issuer: issuer
            });
    }

    function _updateWalletBalance(address recipient, uint256 amount, bool add) internal {
        if (add) {
            wallet.transferFrom(owner, recipient, amount);
            // Allow this contract to spend on recipients behalf
            wallet.allow(recipient, amount);
        } else {
            wallet.transferFrom(recipient, owner, amount);
        }
    }

    function _populateFilteredOrders(
        OrderModelV2.SortedKey memory key,
        OrderModelV2.OrderType orderType, address buyer, address seller) internal {
        filtered[ConstantsV2.PENDING_ORDERS_KEY].push(key);
        if (orderType == OrderModelV2.OrderType.BUY) {
            filtered[ConstantsV2.BUY_ORDERS_KEY].push(key);
            userOrders[buyer].push(key);
        } else {
            filtered[ConstantsV2.SELL_ORDERS_KEY].push(key);
            userOrders[seller].push(key);
        }
    }

    function _matchOrder(OrderModelV2.Order memory mo) internal {
        bool matched;
        OrderModelV2.Order memory matchingOrder = mo;
        uint256 pendingOrdersSize = filtered[ConstantsV2.PENDING_ORDERS_KEY].length;
        if (pendingOrdersSize == 1) {
            return;
        }

        uint256 k = pendingOrdersSize.sub(1);
        uint256 end = pendingOrdersSize > ConstantsV2.MAX_ORDERS_TO_PROCESS ? ConstantsV2.MAX_ORDERS_TO_PROCESS : 0;

        while (k >= end && matched == false) {
            OrderModelV2.Order memory toMatch = orders[filtered[ConstantsV2.PENDING_ORDERS_KEY][k].key];
            // tokenId equals
            bool tokenIdEquals = matchingOrder.tokenId == toMatch.tokenId;
            // Same Type
            bool sameType = toMatch.orderType == matchingOrder.orderType;
            // buyer is different from seller
            bool buyerIsSeller = false;
            if (toMatch.seller != address(0) && matchingOrder.buyer != address(0)) {
                buyerIsSeller = toMatch.seller == matchingOrder.buyer;
            } else if (toMatch.buyer != address(0) && matchingOrder.seller != address(0)) {
                buyerIsSeller = toMatch.buyer == matchingOrder.seller;
            }

            bool shouldProcess = tokenIdEquals &&
                toMatch.status == OrderModelV2.OrderStatus.NEW &&
                !sameType &&
                !buyerIsSeller;

            if (shouldProcess) {
                OrderModelV2.Order memory buyOrder;
                OrderModelV2.Order memory sellOrder;
                ConstantsV2.Values memory returnValues;
                if (matchingOrder.orderType == OrderModelV2.OrderType.BUY) {
                    buyOrder = matchingOrder;
                    sellOrder = toMatch;
                    returnValues = _processOrder(buyOrder, sellOrder);
                    matched = returnValues.matched;
                    matchingOrder = orders[buyOrder.key.key];
                } else if (matchingOrder.orderType == OrderModelV2.OrderType.SELL) {
                    sellOrder = matchingOrder;
                    buyOrder = toMatch;
                    returnValues = _processOrder(buyOrder, sellOrder);
                    matched = returnValues.matched;
                    matchingOrder = orders[sellOrder.key.key];
                }

                if (buyOrder.status == OrderModelV2.OrderStatus.MATCHED || sellOrder.status == OrderModelV2.OrderStatus.MATCHED) {
                    // add totalCost back to wallet and remove from escrow
                    uint256 totalCost = returnValues.toBuy.mul(buyOrder.price);
                    uint256 toSeller = totalCost;
                    if (sellOrder.orderStrategy != OrderModelV2.OrderStrategy.ALL_OR_NONE) {
                        toSeller = returnValues.toSell.mul(sellOrder.price);
                    }

                    // update escrows                    
                    escrow[buyOrder.buyer] = escrow[buyOrder.buyer].sub(totalCost);
                    _updateWalletBalance(buyOrder.buyer, totalCost, true);
                    ShareContract shareContract = shares[buyOrder.tokenId];
                    if(shareContract.transferFrom(owner, sellOrder.seller, returnValues.toBuy)) {
                        shareContract.allow(sellOrder.seller, returnValues.toBuy);
                    } else {
                        revert('NE2');
                    }               

                    // buy the shares. buyer is buying from seller
                    if(wallet.transferFrom(buyOrder.buyer, sellOrder.seller, returnValues.toBuy.mul(buyOrder.price))) {
                        // Allow this contract to spend on seller's behalf
                        wallet.allow(sellOrder.seller, returnValues.toBuy.mul(buyOrder.price));
                        
                        if(shareContract.transferFrom(sellOrder.seller, buyOrder.buyer, returnValues.toBuy)) {
                            // Allow this contract to spend on buyer's behalf
                            shareContract.allow(buyOrder.buyer, returnValues.toBuy);
                        }
                    } else {
                        revert('NEM');
                    }
                } else {
                    // do nothing
                }
            }
            if (k == 0) {
                break;
            } else {
                k = k.sub(1);
            }
        }
    }

    function _processOrder(OrderModelV2.Order memory buyOrder, OrderModelV2.Order memory sellOrder) internal returns (ConstantsV2.Values memory returnValues) {
        returnValues = ConstantsV2.Values({
            matched: false,
            buyExpired: false,
            sellExpired: false,
            toBuy: 0,
            toSell: 0
        });

        uint256 buyerAmount = buyOrder.amountRemaining;
        uint256 sellerAmount = sellOrder.amountRemaining;

        if(buyOrder.goodUntil > 0 && buyOrder.goodUntil < block.timestamp) {
            returnValues.buyExpired = true;
        }
        if(sellOrder.goodUntil > 0 && sellOrder.goodUntil < block.timestamp) {
            returnValues.sellExpired = true;
        }

        if(buyOrder.price >= sellOrder.price && (returnValues.buyExpired == false && returnValues.sellExpired == false)) {
            if(buyerAmount == sellerAmount) {
                _processOrderSameAmount(returnValues, buyOrder, sellOrder);
            } else if (buyerAmount > sellerAmount && buyOrder.orderStrategy != OrderModelV2.OrderStrategy.ALL_OR_NONE) {
                _processOrderBuyPartial(returnValues, buyOrder, sellOrder);
            } else if (buyerAmount < sellerAmount && sellOrder.orderStrategy != OrderModelV2.OrderStrategy.ALL_OR_NONE) {
                _processOrderSellPartial(returnValues, buyOrder, sellOrder);
            }
        } else if(sellOrder.orderStrategy == OrderModelV2.OrderStrategy.MARKET_ORDER && returnValues.sellExpired == false) {
            if(buyerAmount == sellerAmount) {
                _processOrderSameAmount(returnValues, buyOrder, sellOrder);
            } else if (buyerAmount > sellerAmount && buyOrder.orderStrategy != OrderModelV2.OrderStrategy.ALL_OR_NONE) {
                _processOrderBuyPartial(returnValues, buyOrder, sellOrder);
            } else if (buyerAmount < sellerAmount && sellOrder.orderStrategy != OrderModelV2.OrderStrategy.ALL_OR_NONE) {
                _processOrderSellPartial(returnValues, buyOrder, sellOrder);
            }
        }

        orders[sellOrder.key.key] = sellOrder;
        orders[buyOrder.key.key] = buyOrder;
    }

    function _processOrderSameAmount(ConstantsV2.Values memory returnValues, OrderModelV2.Order memory buyOrder, OrderModelV2.Order memory sellOrder) internal {
        returnValues.toBuy = buyOrder.amountRemaining;
        returnValues.toSell = sellOrder.amountRemaining;
        returnValues.matched = true;
        sellOrder.amountRemaining = 0;
        buyOrder.amountRemaining = 0;
        _filterMatchedOrder(buyOrder);
        _filterMatchedOrder(sellOrder);
    }

    function _processOrderBuyPartial(ConstantsV2.Values memory returnValues, OrderModelV2.Order memory buyOrder, OrderModelV2.Order memory sellOrder) internal {
        returnValues.toBuy = sellOrder.amountRemaining;
        returnValues.toSell = sellOrder.amountRemaining;
        buyOrder.amountRemaining = buyOrder.amountRemaining.sub(sellOrder.amountRemaining);
        sellOrder.amountRemaining = 0;
        _filterMatchedOrder(sellOrder);
    }

    function _processOrderSellPartial(ConstantsV2.Values memory returnValues, OrderModelV2.Order memory buyOrder, OrderModelV2.Order memory sellOrder) internal {
        returnValues.toBuy = buyOrder.amountRemaining;
        returnValues.toSell = buyOrder.amountRemaining;
        sellOrder.amountRemaining = sellOrder.amountRemaining.sub(buyOrder.amountRemaining);
        buyOrder.amountRemaining = 0;
        _filterMatchedOrder(buyOrder);
    }

    function _filterMatchedOrder(OrderModelV2.Order memory order) internal {
        OrderModelV2.SortedKey memory key = order.key;
        if(filtered[ConstantsV2.PENDING_ORDERS_KEY].length == 0) {
            return;
        }

        if(filtered[ConstantsV2.PENDING_ORDERS_KEY].length == 1) {
            filtered[ConstantsV2.PENDING_ORDERS_KEY].pop();
            return;
        }

        uint256 size = filtered[ConstantsV2.PENDING_ORDERS_KEY].length.sub(1);
        int256 pos = ConstantsV2.binarySearchV2(filtered[ConstantsV2.PENDING_ORDERS_KEY], 0, int256(size), key);

        if (pos >= 0) {
            for(uint256 i = uint256(pos); i < size; i++) {
                filtered[ConstantsV2.PENDING_ORDERS_KEY][i] = filtered[ConstantsV2.PENDING_ORDERS_KEY][i + 1];
            }
            //delete filtered[ConstantsV2.PENDING_ORDERS_KEY][uint256(pos)];
            filtered[ConstantsV2.PENDING_ORDERS_KEY].pop();
        }

        filtered[ConstantsV2.MATCHED_ORDERS_KEY].push(order.key);
        order.status = OrderModelV2.OrderStatus.MATCHED;
        order.statusDate = block.timestamp;
    }
}
