/// SPDX-License-Identifier: MIT-0
pragma solidity ^0.7.2;
pragma experimental ABIEncoderV2;

library Math {
    function add(uint256 x, uint256 y) public pure returns (uint256 z) {
        require((z = x + y) >= x, 'ds-math-add-overflow');
    }

    function sub(uint256 x, uint256 y) public pure returns (uint256 z) {
        require((z = x - y) <= x, 'ds-math-sub-underflow');
        require((z = x - y) >= 0, 'ds-math-sub-underflow');
    }

    function mul(uint256 x, uint256 y) public pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x, 'ds-math-mul-overflow');
    }

    function div(uint256 a, uint256 b) public pure returns (uint256 z) {
        require(b > 0);
        require(a > 0);        
        z = a / b;
    }    
}