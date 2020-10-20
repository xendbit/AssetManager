/// SPDX-License-Identifier: MIT-0
pragma solidity ^0.7.2;
pragma experimental ABIEncoderV2;

import { OrderModel } from './OrderModel.sol';

struct IndexValue { uint256 keyIndex; OrderModel.Order value; }
struct KeyFlag { uint256 key; bool deleted; }

struct itmap {
    mapping(uint256 => IndexValue) data;
    KeyFlag[] keys;
    uint256 size;
}

library IterableOrder {

    function insert(itmap storage self, uint256 key, OrderModel.Order storage value) internal returns (bool replaced) {
        uint256 keyIndex = self.data[key].keyIndex;
        self.data[key].value = value;
        if (keyIndex > 0)
            return true;
        else {
            self.keys.push();
            keyIndex = self.keys.length;
            self.data[key].keyIndex = keyIndex + 1;
            self.keys[keyIndex].key = key;
            self.size++;
            return false;
        }
    }

    function remove(itmap storage self, uint256 key) internal returns (bool success) {
        uint256 keyIndex = self.data[key].keyIndex;
        if (keyIndex == 0)
            return false;
        delete self.data[key];
        self.keys[keyIndex - 1].deleted = true;
        self.size --;
    }

    function contains(itmap storage self, uint256 key) internal view returns (bool) {
        return self.data[key].keyIndex > 0;
    }

    function iterate_start(itmap storage self) internal view returns (uint256 keyIndex) {
        return iterate_next(self, uint256(-1));
    }

    function iterate_valid(itmap storage self, uint256 keyIndex) internal view returns (bool) {
        return keyIndex < self.keys.length;
    }

    function iterate_next(itmap storage self, uint256 keyIndex) internal view returns (uint256 r_keyIndex) {
        keyIndex++;
        while (keyIndex < self.keys.length && self.keys[keyIndex].deleted)
            keyIndex++;
        return keyIndex;
    }

    function iterate_get(itmap storage self, uint256 keyIndex) internal view returns (uint256 key, OrderModel.Order storage value) {
        key = self.keys[keyIndex].key;
        value = self.data[key].value;
    }
}