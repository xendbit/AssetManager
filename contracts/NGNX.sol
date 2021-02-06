/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract NGNX is ERC20 {
    address private _owner;

    constructor() public ERC20('NGNX Stable Coin', 'NGNX') {
        _owner = msg.sender;
        _setupDecimals(2);
        _mint(msg.sender, 100000000000000);
    }

    function increaseSupply(uint256 byAmount) public {
        require(msg.sender == _owner, 'You do not have the rights to increase supply');
        _mint(msg.sender, byAmount);
    }

    function decreaseSupply(uint256 byAmount) public {
        require(msg.sender == _owner, 'You do not have the rights to decrease supply');
        _burn(msg.sender, byAmount);
    }    
}