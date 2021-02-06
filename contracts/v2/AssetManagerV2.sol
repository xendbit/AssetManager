/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./ShareContract.sol";
import "./PrimaryMarketEscrow.sol";
import "./library/OrderModelV2.sol";
import "./library/ConstantsV2.sol";

contract AssetManagerV2 is ERC165, IERC721 {
    // emitted when an asset is bought or sold
    event OrderChanged(bytes32 key, uint256 newStatus, uint256 amountRemaining);

    using SafeMath for uint256;
    using Address for address;
    // Equals to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    // which can be also obtained as `IERC721Receiver(0).onERC721Received.selector`
    bytes4 private constant _ERC721_RECEIVED = 0x150b7a02;

    // Mapping from token ID to index of the owner tokens list
    mapping(uint256 => uint256) private ownedTokensIndex;
    //Mapping from token id to position in the allTokens array
    mapping(uint256 => uint256) private allTokensIndex;

    // Mapping address to the number of tokens owned
    mapping(address => uint256) balances;

    // all tokens array
    uint256[] private allTokens;

    // Mapping of address to the list of tokens owned
    mapping (address => uint256[]) private ownedTokens;

    // Mapping of tokens to the owner's address
    mapping (uint256 => address) private tokenOwner;

    // Mapping of tokens to the issuers's address
    mapping (uint256 => address) private tokenIssuer;

    // how many tokens owned by address
    mapping (address => uint256) private ownedTokensCount;

    // token uris
    mapping(uint256 => string ) tokenURIs;

    // total supply of tokens
    uint256 totalSupply_;

    mapping (uint256 => address) private _tokenApprovals;
    mapping (address => mapping (address => bool)) private _operatorApprovals;


    string private _baseURI;
    bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;
    bytes4 private constant _INTERFACE_ID_ERC721_METADATA = 0x5b5e139f;
    bytes4 private constant _INTERFACE_ID_ERC721_ENUMERABLE = 0x780e9d63;


    mapping(uint256 => ShareContract) private shares;

    ShareContract private wallet;
    PrimaryMarketEscrow private pme;

    // Store All Orders. Key is OrderModelV2.Order Key
    mapping(bytes32 => OrderModelV2.Order) private orders;

    // Store All Orders. Key is hash of keys
    mapping(bytes32 => OrderModelV2.SortedKey[]) private filtered;

    address private owner;

    // store xether that is tied down by a buy order, key is address
    mapping(address => uint256) escrow;

    // Token name
    string private _name;

    // Token symbol
    string private _symbol;
    
    //address private constant burner = 0x3737373737373737373737373737373737373737;
    address private constant burner = 0x1337133713371337133713371337133713371337;

    constructor() public {
        _name = "NSE Art Exchange";
        _symbol = "ARTX";

        // register the supported interfaces to conform to ERC721 via ERC165
        _registerInterface(_INTERFACE_ID_ERC721);
        _registerInterface(_INTERFACE_ID_ERC721_METADATA);
        _registerInterface(_INTERFACE_ID_ERC721_ENUMERABLE);

        owner = msg.sender;
        wallet = new ShareContract("WALLET", 1, msg.sender, 0, 0);
        pme = new PrimaryMarketEscrow(address(this));
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        return tokenURIs[tokenId];
    }

    function mint(
        uint256 tokenId,
        string calldata tokenSymbol,
        uint256 totalSupply,
        uint256 issuingPrice,
        address issuer,
        string calldata uri
    ) public {
        require(issuer != address(0));
        require(owner == msg.sender);
        _safeMint(msg.sender, tokenId);
        tokenURIs[tokenId] = uri;
        tokenIssuer[tokenId] = issuer;
        // create an ERC20 Smart contract and assign the shares to issuer
        ShareContract shareContract = new ShareContract(
            tokenSymbol,
            issuingPrice,
            issuer,
            0,
            totalSupply
        );
        shares[tokenId] = shareContract;
    }

    function approve(address to, uint256 tokenId) public override {
        address ownerOf_ = ownerOf(tokenId);
        require(to != ownerOf_, "ERC721: approval to current owner");

        require(msg.sender == ownerOf_ || isApprovedForAll(ownerOf_, msg.sender),
            "ERC721: approve caller is not owner nor approved for all"
        );

        _approve(to, tokenId);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        require(tokenOwner[tokenId] != address(0), "ERC721: approved query for nonexistent token");

        return _tokenApprovals[tokenId];
    }

    function isApprovedForAll(address owner_, address operator) public view override returns (bool) {
        return _operatorApprovals[owner_][operator];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        return tokenOwner[tokenId];
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        // TBD
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual override {
        // TBD
    }

    function setApprovalForAll(address operator, bool approved) public virtual override {
        require(operator != msg.sender, "ERC721: approve to caller");

        _operatorApprovals[msg.sender][operator] = approved;
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
    }

    function balanceOf(address owner_) public view override returns (uint256) {
        return balances[owner_];
    }

    function walletBalance(address userAddress) public view returns (uint256) {
        return wallet.allowance(userAddress, address(this));
    }

    function ownedShares(uint256 tokenId, address userAddress) public view returns (uint256) {
        ShareContract shareContract = shares[tokenId];
        return shareContract.allowance(userAddress, address(this));
    }

    function buy(bytes32 orderKey, uint256 marketType, uint256 amount) external {
        OrderModelV2.Order memory or = orders[orderKey];
        uint256 amountToBuy = amount == 0 ? or.amountRemaining : amount;
        if(marketType == ConstantsV2.MarketTypePrimary) {
            uint256 totalCost = amountToBuy.mul(or.price);
            _buy(orderKey, amountToBuy);
            //2. If Market is Primary, burn the tokens from seller and put a value in escrow.
            wallet.transferFrom(or.seller, burner, totalCost);
            pme.buy(or.tokenId, msg.sender, or.seller, totalCost);
        } else {
            _buy(orderKey, amountToBuy);
        }
    }
    
    function postOrder(
        uint256 orderType,
        uint256 orderStrategy,
        uint256 amount,
        uint256 price,
        uint256 tokenId,
        uint256 goodUntil,
        bytes32 key,
        uint256 marketType
    ) external {
        require(orders[key].tokenId == 0, 'SK');
        address seller;
        address buyer;
        if (orderType == ConstantsV2.OrderTypeBuy) {
            buyer = msg.sender;
            seller = address(0);
            uint256 totalCost = amount.mul(price);
            uint256 buyerNgncBalance = wallet.allowance(buyer, address(this)) - escrow[buyer];

            if (buyerNgncBalance >= totalCost) {
                // update escrow
                escrow[buyer] = escrow[buyer].add(totalCost);
            } else {
                revert("L");
            }
        } else if (orderType == ConstantsV2.OrderTypeSell) {
            buyer = address(0);
            seller = msg.sender;
            //make sure seller is issuer if market is Primary
            if(marketType == ConstantsV2.MarketTypePrimary) {
                require(seller == tokenIssuer[tokenId], "SMBI");
            }
            //check that you have the asset you want to sell
            ShareContract shareContract = shares[tokenId];
            uint256 sellerShares = shareContract.allowance(seller, address(this));

            if (sellerShares < amount) {
                revert("NA");
            } else {
                // escrow it
                if(shareContract.transferFrom(seller, owner, amount)) {
                    shareContract.allow(owner, amount);
                }
            }
        }

        OrderModelV2.SortedKey memory sortedKey = OrderModelV2.SortedKey({ key: key, date: block.timestamp });

        OrderModelV2.Order memory dbOrder = OrderModelV2.Order({
            key: sortedKey,
            orderType: orderType,
            orderStrategy: orderStrategy,
            seller: seller,
            buyer: buyer,
            tokenId: tokenId,
            amountRemaining: amount,
            originalAmount: amount,
            price: price,
            status: ConstantsV2.OrderStatusNew,
            goodUntil: goodUntil,
            marketType: marketType
        });

        orders[key] = dbOrder;

        _populateFilteredOrders(dbOrder.key, dbOrder.orderType);

        _matchOrder(dbOrder);
    }

    function getOrder(bytes32 key) public view returns (OrderModelV2.Order memory) {
        return orders[key];
    }

    function fundWallet(address recipient, uint256 amount) public {
        require(owner == msg.sender, 'OF');
        wallet.mintToken(recipient, amount);
    }
    
    function escrowBalance(uint256 tokenId) public view returns (uint256) {
        ShareContract shareContract = shares[tokenId];
        return shareContract.allowance(owner, address(this));
    }
    
    function totalValueSold(uint256 tokenId) public view returns (uint256) {
        return pme.totalSold(tokenId, tokenIssuer[tokenId]);
    }
    
    function primaryMarketBuyers(uint256 tokenId) public view returns (address[] memory) {
        return pme.buyers(tokenId);
    }
    
    function underSubscribed(uint256 tokenId) public {
        require(owner == msg.sender);
        address[] memory buyers = pme.buyers(tokenId);
        ShareContract shareContract = shares[tokenId];
        for(uint8 i = 0; i < buyers.length; i++) {
            uint256 investmentValue = pme.investmentValue(tokenId, buyers[i]);
            if(investmentValue > 0) {
                // burn the tokens
                if(shareContract.transferFrom(buyers[i], burner, shareContract.allowance(buyers[i], address(this)))) {
                    // refund the buyer
                    fundWallet(buyers[i], investmentValue);
                }
            }
        }
        
        // any unbought tokens should be burned
        shareContract.transferFrom(owner, burner, shareContract.allowance(owner, address(this)));
    }
    
    function concludePrimarySales(uint256 tokenId) public {
        require(owner == msg.sender);
        ShareContract shareContract = shares[tokenId];
        // any unbought tokens should be burned
        shareContract.transferFrom(owner, burner, shareContract.allowance(owner, address(this)));
    }

    function tokenShares(uint256 tokenId) public view returns (uint256, address, address, string memory, string memory, uint256, uint256, address) {
        return shares[tokenId].details(tokenId, tokenOwner[tokenId]);
    }

    function _populateFilteredOrders(
        OrderModelV2.SortedKey memory key,
        uint256 orderType
    ) internal {
        filtered[ConstantsV2.PENDING_ORDERS_KEY].push(key);
        if (orderType == ConstantsV2.OrderTypeBuy) {
            filtered[ConstantsV2.BUY_ORDERS_KEY].push(key);
        } else {
            filtered[ConstantsV2.SELL_ORDERS_KEY].push(key);
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
            bool sameMarketType = toMatch.marketType == matchingOrder.marketType;

            bool shouldProcess = tokenIdEquals &&
                toMatch.status == ConstantsV2.OrderStatusNew &&
                !sameType &&
                sameMarketType &&
                !buyerIsSeller;

            if (shouldProcess) {
                OrderModelV2.Order memory buyOrder;
                OrderModelV2.Order memory sellOrder;
                ConstantsV2.Values memory returnValues;
                if (matchingOrder.orderType == ConstantsV2.OrderTypeBuy) {
                    buyOrder = matchingOrder;
                    sellOrder = toMatch;
                    returnValues = _processOrder(buyOrder, sellOrder);
                    matched = returnValues.matched;
                    matchingOrder = orders[buyOrder.key.key];
                } else if (matchingOrder.orderType == ConstantsV2.OrderTypeSell) {
                    sellOrder = matchingOrder;
                    buyOrder = toMatch;
                    returnValues = _processOrder(buyOrder, sellOrder);
                    matched = returnValues.matched;
                    matchingOrder = orders[sellOrder.key.key];
                }

                if (buyOrder.status == ConstantsV2.OrderStatusMatched || sellOrder.status == ConstantsV2.OrderStatusMatched) {
                    // add totalCost back to wallet and remove from escrow
                    uint256 totalCost = returnValues.toBuy.mul(buyOrder.price);
                    uint256 toSeller = totalCost;
                    if (sellOrder.orderStrategy != ConstantsV2.OrderStrategyAON) {
                        toSeller = returnValues.toSell.mul(sellOrder.price);
                    }

                    // update escrow
                    escrow[buyOrder.buyer] = escrow[buyOrder.buyer].sub(totalCost);

                    // send the shares back to seller from escrow (owner)
                    ShareContract shareContract = shares[buyOrder.tokenId];
                    if(shareContract.transferFrom(owner, sellOrder.seller, returnValues.toBuy)) {
                        shareContract.allow(sellOrder.seller, returnValues.toBuy);
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
            } else if (buyerAmount > sellerAmount && buyOrder.orderStrategy != ConstantsV2.OrderStrategyAON) {
                _processOrderBuyPartial(returnValues, buyOrder, sellOrder);
            } else if (buyerAmount < sellerAmount && sellOrder.orderStrategy != ConstantsV2.OrderStrategyAON) {
                _processOrderSellPartial(returnValues, buyOrder, sellOrder);
            }
        } else if(sellOrder.orderStrategy == ConstantsV2.OrderStrategyMO && returnValues.sellExpired == false) {
            if(buyerAmount == sellerAmount) {
                _processOrderSameAmount(returnValues, buyOrder, sellOrder);
            } else if (buyerAmount > sellerAmount && buyOrder.orderStrategy != ConstantsV2.OrderStrategyAON) {
                _processOrderBuyPartial(returnValues, buyOrder, sellOrder);
            } else if (buyerAmount < sellerAmount && sellOrder.orderStrategy != ConstantsV2.OrderStrategyAON) {
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
        order.status = ConstantsV2.OrderStatusMatched;
        emit OrderChanged(order.key.key, order.status, order.amountRemaining);
    }

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data) private returns (bool) {
        if (!to.isContract()) {
            return true;
        }
        bytes memory returndata = to.functionCall(abi.encodeWithSelector(
            IERC721Receiver(to).onERC721Received.selector,
            msg.sender,
            from,
            tokenId,
            _data
        ), "ERC721: transfer to non ERC721Receiver implementer");
        bytes4 retval = abi.decode(returndata, (bytes4));
        return (retval == _ERC721_RECEIVED);
    }

    function _safeMint(address _to, uint256 tokenId) private returns (bool) {
        require(tokenOwner[tokenId] == address(0), 'Token Already Minted');

        totalSupply_ = totalSupply_.add(1);
        balances[_to] = balances[_to].add(1);

        allTokensIndex[tokenId] = allTokens.length;
        allTokens.push(tokenId);

        ownedTokens[_to].push(tokenId);
        tokenOwner[tokenId] = _to;

        ownedTokensIndex[tokenId] = ownedTokensCount[_to];
        ownedTokensCount[_to] = ownedTokensCount[_to].add(1);
        require(_checkOnERC721Received(address(0), _to, tokenId, ''), "ERC721: transfer to non ERC721Receiver implementer");

        emit Transfer(address(0), _to, tokenId);
        return true;
    }

    function _approve(address to, uint256 tokenId) private {
        _tokenApprovals[tokenId] = to;
    }
    
    function _buy(bytes32 orderKey, uint256 amount) internal {
        address buyer = msg.sender;
        OrderModelV2.Order memory or = orders[orderKey];
        require(amount > 0, 'FN');
        require(amount <= or.amountRemaining, 'TM');
        require(or.seller != buyer, 'SAS');
        // check that buyer have enough money to buy
        uint256 totalCost = amount.mul(or.price);
        uint256 buyerNgncBalance = wallet.allowance(buyer, address(this));
        if (buyerNgncBalance >= totalCost) {
            ShareContract shareContract = shares[or.tokenId];
            // update escrows
            if(shareContract.transferFrom(owner, or.seller, amount)) {
                shareContract.allow(or.seller, amount);
            } else {
                revert('NE');
            }

            if(wallet.transferFrom(buyer, or.seller, totalCost)) {
                // Allow this contract to spend on seller's behalf
                wallet.allow(or.seller, totalCost);

                if(shareContract.transferFrom(or.seller, buyer, amount)) {
                    // Allow this contract to spend on buyer's behalf
                    shareContract.allow(buyer, amount);
                }
            } else {
                revert('N');
            }
            or.amountRemaining = or.amountRemaining - amount;
            _filterMatchedOrder(or);
            orders[or.key.key] = or;
        } else {
            revert("L");
        }
    }    
}
