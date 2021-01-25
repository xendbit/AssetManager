/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "./library/openzeppelin/ERC20.sol";
import "./library/openzeppelin/SafeMath.sol";

contract ShareContract is ERC20 {
    using SafeMath for uint256;
    
    uint256 private _issuingPrice;
    address _issuer;

    constructor (
        string memory description,
        string memory symbol,
        uint256 totalSupply,
        uint256 price,
        address owner
    ) public ERC20(description, symbol) {
        // constructor
        address assetManagerV2 = msg.sender;
        _mint(owner, totalSupply);
        _approve(owner, assetManagerV2, totalSupply);
        _issuingPrice = price;
        _issuer = owner;
    }

    function issuingPrice() public view returns (uint256) {
        return _issuingPrice;
    }

    function issuer() public view returns (address) {
        return _issuer;
    }

    function allow(address owner, uint256 amount) public {
        address assetManagerV2 = msg.sender; // spender
        uint256 currentBalance = allowance(owner, assetManagerV2);
        _approve(owner, assetManagerV2, amount.add(currentBalance));
    }

    function details(uint256 tokenId, address owner) public view 
    returns (uint256, address, address, string memory, string memory, uint256, uint256, address) {
        return (tokenId, owner, address(this), name(), symbol(), totalSupply(), issuingPrice(), issuer());
    }
}
