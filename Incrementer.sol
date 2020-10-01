/// SPDX-License-Identifier: MIT-0
pragma solidity ^0.7.2;

contract Incrementer {
    uint256 public number;

    constructor(uint256 _initialNumber)  {
        number = _initialNumber;
    }

    function increment(uint256 _value) public {
        number = number + _value;
    }

    function reset() public {
        number = 0;
    }
}