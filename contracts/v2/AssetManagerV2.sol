/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./ShareContract.sol";
import "./library/AssetModelV2.sol";

contract AssetManagerV2 is ERC721('NSE Art Exchange', 'ARTX') {
    event DEBUG(address str);
    event DEBUG(string str);

    mapping (uint256 => ShareContract) shares;

    ShareContract wallet;

    address owner;

    constructor() public {
        owner = msg.sender;        
        wallet = new ShareContract('Tether Token 1-1 with local currency', 'WALLET', 2**250, 1, msg.sender);
        emit DEBUG("Wallet Address");
        emit DEBUG(address(wallet));
    }

    function mint(AssetModelV2.AssetRequest memory ar) external {
        require(owner == msg.sender);        
        _safeMint(msg.sender, ar.tokenId);
        // create an ERC20 Smart contract and assign the shares to issuer
        ShareContract shareContract = new ShareContract(ar.name, ar.symbol, ar.totalQuantity, ar.price, ar.issuer);
        shares[ar.tokenId] = shareContract;
    }
    
    function ownedShares(uint256 tokenId, address userAddress) external view returns(uint256) {
        ShareContract shareContract = shares[tokenId];
        return shareContract.allowance(userAddress, address(this));
    }

    function transferShares(uint256 tokenId, address recipient, uint256 amount) external {
        ShareContract shareContract = shares[tokenId];
        shareContract.transferFrom(msg.sender, recipient, amount);      
        // Allow this contract to spend on recipients behalf  
        shareContract.allow(recipient, amount);
    }

    function walletBalance(address userAddress) external view returns(uint256) {
        return wallet.allowance(userAddress, address(this));
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
    function buyShares(uint256 tokenId, address seller, uint256 amount, uint256 price) external {
        address buyer = msg.sender;        
        wallet.transferFrom(buyer, seller, amount.mul(price));
        // Allow this contract to spend on seller's behalf
        wallet.allow(seller, amount.mul(price));

        ShareContract shareContract = shares[tokenId];
        shareContract.transferFrom(seller, buyer, amount);
        // Allow this contract to spend on buyer's behalf
        shareContract.allow(buyer, amount);
    }

    function sharesContract(uint256 tokenId) external view returns (address, uint256, string memory, string memory, uint256, uint256) {        
        ShareContract shareContract = shares[tokenId];
        return shareContract.details(tokenId);
    }
}
