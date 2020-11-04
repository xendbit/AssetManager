const Web3 = require('web3');
const props = require('../config/config');
const path = require('path');
const fs = require('fs');
const { expect } = require('chai');
const Utils = require('web3-utils');
const web3 = new Web3(props.web3URL);
const contractAddress = props.contractAddress;
const abi = JSON.parse(fs.readFileSync(path.resolve(props.abiPath), 'utf8'));
const AssetManagerContract = new web3.eth.Contract(abi.abi, contractAddress);
AssetManagerContract.handleRevert = true;

const OrderType = {
    BUY: 0,
    SELL: 1,
}
const OrderStrategy = {
    GTC: 0,
    AON: 1,
    GTD: 2,
    GTM: 3,
    MO: 4,
}

function getAssets(callback) {
    AssetManagerContract.methods.getAssets().call({ from: props.address }).then(result => {
        expect(result).to.be.a("array").to.have.length.above(0);
        callback(result);
    });
}

function getOrder(key, callback) {
    AssetManagerContract.methods.getOrder(key).call({ from: props.address }).then(result => {
        callback(result);
    });
}

function getFilteredOrders(key, callback) {
    if (key === 'BUY') {
        AssetManagerContract.methods.getBuyOrders().call({ from: props.address }).then(result => {
            expect(result).to.be.an("array");
            callback(result);
        });
    } else if (key === 'SELL') {
        AssetManagerContract.methods.getSellOrders().call({ from: props.address }).then(result => {
            expect(result).to.be.an("array");
            callback(result);
        });
    } else if (key === 'MATCHED') {
        AssetManagerContract.methods.getMatchedOrders().call({ from: props.address }).then(result => {
            expect(result).to.be.an("array");
            callback(result);
        });
    } else if (key.indexOf('0x') === 0) {
        AssetManagerContract.methods.getUserOrders(key).call({ from: props.address }).then(result => {
            expect(result).to.be.an("array");
            callback(result);
        });
    }
}

function testOrder(order) {
    expect(order).to.have.property("seller");
    expect(order).to.have.property("buyer");
    expect(order).to.have.property("originalAmount");
    expect(order).to.have.property("amount");
    expect(order).to.have.property("assetName").to.equal('BUD');
    expect(order).to.have.property("price");
    expect(order).to.have.property("key");
}

function testAsset(asset) {
    expect(asset).to.have.property("name").to.equal('BUD');
    expect(asset).to.have.property("issuer");
    expect(asset).to.have.property("owner");
    expect(asset).to.have.property("decimal").to.equal('2');
}

function getOrderRequest(orderType, orderStrategy, amount, price, assetName, assetIssuer, goodUntil, sender) {
    const key = Utils.soliditySha3(
        { type: 'uint256', value: amount },
        { type: 'uint256', value: price },
        { type: 'string', value: assetName },
        { type: 'address', value: assetIssuer },
        { type: 'address', value: sender },
        { type: 'uint256', value: new Date().getTime() }
    );
    console.log('KEY: ', key);

    return orderRequest = {
        orderType: orderType,
        orderStrategy: orderStrategy,
        amount: amount,
        price: price,
        assetName: assetName,
        assetIssuer: assetIssuer,
        goodUntil: goodUntil,
        key: key
    }
}

function unlockAccounts(done) {
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        console.log(`unlocked ${props.address}`);
        web3.eth.personal.unlockAccount(props.user1.address, 'Wq017kmg@tm').then(() => {
            console.log(`unlocked ${props.user1.address}`);
            web3.eth.personal.unlockAccount(props.user2.address, 'Wq017kmg@tm').then(() => {
                console.log(`unlocked ${props.user2.address}`);
                web3.eth.personal.unlockAccount(props.contractor, 'Wq017kmg@tm').then(() => {
                    console.log(`unlocked ${props.contractor}`);
                    done();
                });
            });
        })
    });
}

module.exports = {
    getOrderRequest,
    testAsset,
    testOrder,
    getFilteredOrders,
    getOrder,
    getAssets,
    unlockAccounts,
    OrderStrategy,
    OrderType,
}