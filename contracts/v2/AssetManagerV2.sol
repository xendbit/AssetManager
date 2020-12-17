/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./ShareContract.sol";
import "./library/AssetModelV2.sol";
import "./library/OrderModelV2.sol";
import "../library/Constants.sol";

contract AssetManagerV2 is ERC721("NSE Art Exchange", "ARTX") {
    event DEBUG(address str);
    event DEBUG(uint256 str);
    event DEBUG(string str);
    event OrderPosted(OrderModelV2.Order order);
    event OrderBought(OrderModelV2.Order order);
    event OrderSold(OrderModelV2.Order order);

    mapping(uint256 => ShareContract) shares;

    ShareContract wallet;

    // Store All Orders. Key is OrderModel.Order Key
    mapping(bytes32 => OrderModelV2.Order) orders;

    // Store All Orders. Key is hash of keys
    mapping(bytes32 => OrderModelV2.SortedKey[]) filtered;
    mapping(address => OrderModelV2.SortedKey[]) userOrders;

    address owner;

    // store xether that is tied down by a buy order, key is address
    mapping(address => uint256) escrow;

    constructor() public {
        owner = msg.sender;
        wallet = new ShareContract(
            "Tether Token",
            "WALLET",
            2**250,
            1,
            msg.sender
        );
    }

    function walletBalance(address userAddress)
        external
        view
        returns (uint256)
    {
        return wallet.allowance(userAddress, address(this));
    }

    function ownedShares(uint256 tokenId, address userAddress)
        external
        view
        returns (uint256)
    {
        ShareContract shareContract = shares[tokenId];
        return shareContract.allowance(userAddress, address(this));
    }

    function postOrder(OrderModelV2.OrderRequest memory or) external {
        OrderModelV2.validateOrder(or);

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
                revert("Low Balance");
            }
        } else if (or.orderType == OrderModelV2.OrderType.SELL) {
            buyer = address(0);
            seller = msg.sender;
            //check that you have the asset you want to sell
            ShareContract shareContract = shares[or.tokenId];
            uint256 sellerShares = shareContract.allowance(seller, address(this));
            if (sellerShares < or.amount) {
                revert("You don't have enough shares for this transaction");
            }
        }

        OrderModelV2.SortedKey memory sortedKey = OrderModelV2.SortedKey({
            key: or.key,
            date: block.timestamp
        });

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

        _populateFilteredOrders(
            dbOrder.key,
            dbOrder.orderType,
            dbOrder.buyer,
            dbOrder.seller
        );

        emit OrderPosted(dbOrder);
        _matchOrder(dbOrder);
    }

    function getOrder(bytes32 key) external view returns (OrderModelV2.Order memory) {    
        return orders[key];
    }

    function mint(AssetModelV2.AssetRequest memory ar) external {
        AssetModelV2.validateAsset(ar);
        require(owner == msg.sender);
        _safeMint(msg.sender, ar.tokenId);
        // create an ERC20 Smart contract and assign the shares to issuer
        ShareContract shareContract = new ShareContract(
            ar.name,
            ar.symbol,
            ar.totalQuantity,
            ar.price,
            ar.issuer
        );
        shares[ar.tokenId] = shareContract;
    }

    function transferShares(
        uint256 tokenId,
        address recipient,
        uint256 amount
    ) external {
        shares[tokenId].transferFrom(msg.sender, recipient, amount);
        // Allow this contract to spend on recipients behalf
        shares[tokenId].allow(recipient, amount);
    }

    function transferTokenOwnership(uint256 tokenId, address recipient)
        external
    {
        uint256 sharesOwned = shares[tokenId].allowance(
            msg.sender,
            address(this)
        );

        // first transfer the shares owned by the caller in tokenId
        shares[tokenId].transferFrom(msg.sender, recipient, sharesOwned);
        shares[tokenId].allow(recipient, sharesOwned);
        // then transfer ownership of the token
        safeTransferFrom(msg.sender, recipient, tokenId);
    }

    function fundWallet(address recipient, uint256 amount) external {
        require(owner == msg.sender);
        wallet.transferFrom(msg.sender, recipient, amount);
        // Allow this contract to spend on recipients behalf
        wallet.allow(recipient, amount);
    }

    /**
        Caller of the contract is the buyer.
        Buyer transfers amount * price to seller from wallet
        Seller transfers amount to buyer from shares
     */
    function buyShares(
        uint256 tokenId,
        address seller,
        uint256 amount,
        uint256 price
    ) external {
        address buyer = msg.sender;
        wallet.transferFrom(buyer, seller, amount.mul(price));
        // Allow this contract to spend on seller's behalf
        wallet.allow(seller, amount.mul(price));

        ShareContract shareContract = shares[tokenId];
        shareContract.transferFrom(seller, buyer, amount);
        // Allow this contract to spend on buyer's behalf
        shareContract.allow(buyer, amount);
    }

    function tokenShares(uint256 tokenId)
        external
        view
        returns (AssetModelV2.TokenShares memory)
    {
        address tokenOwner = ownerOf(tokenId);
        ShareContract shareContract = shares[tokenId];
        (
            address sharesContract,
            string memory name,
            string memory symbol,
            uint256 totalSupply,
            uint256 issuingPrice
        ) = shareContract.details();
        return
            AssetModelV2.TokenShares({
                tokenId: tokenId,
                owner: tokenOwner,
                sharesContract: sharesContract,
                name: name,
                symbol: symbol,
                totalSupply: totalSupply,
                issuingPrice: issuingPrice
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
        OrderModelV2.OrderType orderType,
        address buyer,
        address seller
    ) internal {
        filtered[Constants.PENDING_ORDERS_KEY].push(key);
        if (orderType == OrderModelV2.OrderType.BUY) {
            filtered[Constants.BUY_ORDERS_KEY].push(key);
            userOrders[buyer].push(key);
        } else {
            filtered[Constants.SELL_ORDERS_KEY].push(key);
            userOrders[seller].push(key);
        }
    }

    function _matchOrder(OrderModelV2.Order memory matchingOrder) internal {}
}
