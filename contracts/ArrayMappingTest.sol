/// SPDX-License-Identifier: MIT-0
pragma solidity ^0.7.2;
pragma experimental ABIEncoderV2;

contract ArrayMappingTest {   
    mapping (bytes32 => uint256[]) public filteredOrders;
    
    constructor() {
    }

    function add(string memory key, uint256 value) public {
        bytes32 keyHash = keccak256(bytes(key));
        filteredOrders[keyHash].push(value);
    }

    function get(string memory key) public view returns (uint256[] memory) {
        bytes32 keyHash = keccak256(bytes(key));
        return filteredOrders[keyHash];
    }

    function remove(string memory key, uint256 index) public {
        bytes32 keyHash = keccak256(bytes(key));
        // copy last element into index;
        uint256 lastIndex = filteredOrders[keyHash].length - 1;
        filteredOrders[keyHash][index] = filteredOrders[keyHash][lastIndex];
        filteredOrders[keyHash].pop();
    }

    function clear(string memory key) public {
        bytes32 keyHash = keccak256(bytes(key));
        delete filteredOrders[keyHash];
    }
}