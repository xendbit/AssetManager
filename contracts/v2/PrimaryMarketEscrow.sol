/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;

// use safe math please
contract PrimaryMarketEscrow {
    address owner;

    // primary market escrow tokenid => issuer => amount
    mapping(uint256 => mapping(address => uint256)) private primaryMarketSales;
    // primary market escrow tokenid => issuer => amount
    mapping(uint256 => mapping(address => uint256)) private primaryMarketBuys;    
    // primary market list of buyers
    mapping (uint256 => address[]) private primaryMarketBuyers;

    constructor(address who) public {
        require(who != address(0), 'VAN');
        owner = who;
    }
    
    function buy(uint256 tokenId, address buyer, address seller, uint256 totalCost) public {
        require(msg.sender == owner, 'NOB');
        primaryMarketSales[tokenId][seller] = primaryMarketSales[tokenId][seller] + totalCost;
        primaryMarketBuys[tokenId][buyer] = primaryMarketBuys[tokenId][buyer] + totalCost;
        primaryMarketBuyers[tokenId].push(buyer);
    }

    function buyers(uint256 tokenId) public view returns (address[] memory) {
        return primaryMarketBuyers[tokenId];
    }

    function investmentValue(uint256 tokenId, address buyer) public view returns (uint256) {
        return primaryMarketBuys[tokenId][buyer];
    }

    function totalSold(uint256 tokenId, address seller) public view returns (uint256) {
        return primaryMarketSales[tokenId][seller];
    }
}