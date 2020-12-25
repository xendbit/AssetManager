const Web3 = require('web3');
const props = require('../config/config');
const path = require('path');
const fs = require('fs');
const web3 = new Web3(props.web3URL);
const contractAddress = props.v2.contractAddress;
const abiPath = props.v2.abiPath;
const abi = JSON.parse(fs.readFileSync(path.resolve(abiPath), 'utf8'));
const AssetManagerContract = new web3.eth.Contract(abi.abi, contractAddress);
const TIMEOUT = 120000;
const { assert } = require('chai');
const { unlockAccounts, getOrderRequestV2, OrderType, OrderStrategy } = require('./test_utils.js');

const ar = {
    tokenId: Math.floor(Math.random() * 100000000),
    description: 'Test Asset',
    symbol: 'TAX',
    totalSupply: 1000000,
    issuingPrice: 10,
    issuer: props.issuer
};

const ar2 = {
    description: 'Test Asset',
    tokenId: Math.floor(Math.random() * 100000000),
    symbol: 'TAX',
    totalSupply: 1000000,
    issuingPrice: 10,
    issuer: props.issuer
};

const issuer = props.issuer;
let issuerBalance = 0;
let issuerWalletBalance = 0;

let user1WalletBalance = 0;
let user2WalletBalance = 0;

let user1OwnedShares = 0;
let user2OwnedShares = 0;

let sellOrder1Key = "";
let buyOrder1Key = "";

describe('Asset Manager V2 Minting Test', () => {
    before(function (done) {
        this.timeout(TIMEOUT);
        unlockAccounts(done);
    }); 

    it('Should mint a new token', (done) => {
        AssetManagerContract.methods.mint(ar).send({ from: props.contractor}).then(() => {
            console.log('Asset Minted');
            issuerBalance += ar.totalSupply;
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it('Should not mint a new token (token id must be unique)', (done) => {
        AssetManagerContract.methods.mint(ar).send({ from: props.contractor}).then(() => {
            done();
        }, (error) => {
            try {
                assert.isFalse(error === undefined);
                assert.isNotNull(error);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it('Should not mint a new token (minter must be contractor)', (done) => {
        AssetManagerContract.methods.mint(ar2).send({ from: props.issuer}).then(() => {
            done();
        }, (error) => {
            try {
                assert.isFalse(error === undefined);
                assert.isNotNull(error);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it('Should check token share contract is not empty', (done) => {
        AssetManagerContract.methods.tokenShares(ar.tokenId).call().then((sca) => {
            console.log(sca);
            try {
                assert.equal(sca.owner, props.contractor);
                assert.equal(sca.tokenId, ar.tokenId);
                assert.equal(sca.description, ar.description);
                assert.equal(sca.symbol, ar.symbol);
                assert.equal(sca.totalSupply, ar.totalSupply);
                assert.equal(sca.issuingPrice, ar.issuingPrice);
                assert.notEqual(sca.sharesContract, "0x0000000000000000000000000000000000000000");
                done();
            } catch (e) {
                done(e);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it('should load balances', (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.user1.address).call().then((ownedShares) => {
            user1OwnedShares = +ownedShares;
            console.log(`user1 owned shares: ${user1OwnedShares}`);
            AssetManagerContract.methods.ownedShares(ar.tokenId, props.user2.address).call().then((ownedShares) => {
                user2OwnedShares = +ownedShares;
                console.log(`user2 owned shares: ${user2OwnedShares}`);
                AssetManagerContract.methods.walletBalance(props.user1.address).call().then((walletBalance) => {
                    user1WalletBalance = +walletBalance;
                    console.log(`user1 wallet balance: ${user1WalletBalance}`);
                    AssetManagerContract.methods.walletBalance(props.user2.address).call().then((walletBalance) => {
                        user2WalletBalance = +walletBalance;
                        console.log(`user2 wallet balance: ${user2WalletBalance}`);
                        AssetManagerContract.methods.walletBalance(issuer).call().then((walletBalance) => {
                            issuerWalletBalance = +walletBalance;
                            console.log(`issuer wallet balance: ${issuerWalletBalance}`);
                            done();
                        });
                    });
                });
            });
        });
    }).timeout(TIMEOUT);
});

// NOTE: When Minting is done, the token belongs to the minter - i.e the contractor...creator of contract.
// Before trading can start, you need to transfer the token to the issuer

describe('Asset Manager Token Transfer Tests', () => {
    it('Should transfer token ownership from contractor to issuer', (done) => {
        AssetManagerContract.methods.transferTokenOwnership(ar.tokenId, props.issuer).send({ from: props.contractor}).then(() => {
            console.log(`Token ${ar.tokenId} Ownership transfered from ${props.contractor} to ${props.issuer}`)
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it('Should confirm ownership transfer', (done) => {
        AssetManagerContract.methods.tokenShares(ar.tokenId).call().then((sca) => {
            try {
                assert.equal(sca.owner, props.issuer);
                assert.equal(sca.tokenId, ar.tokenId);
                assert.equal(sca.description, ar.description);
                assert.equal(sca.symbol, ar.symbol);
                assert.equal(sca.totalSupply, ar.totalSupply);
                assert.equal(sca.issuingPrice, ar.issuingPrice);
                assert.notEqual(sca.sharesContract, "0x0000000000000000000000000000000000000000");
                done();
            } catch (e) {
                done(e);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it('should confirm owned shares', (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.issuer).call().then((ownedShares) => {
            assert.equal(ownedShares, ar.totalSupply);
            done();
        }, error => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it('Should not transfer token you do not own', (done) => {
        AssetManagerContract.methods.transferTokenOwnership(ar.tokenId, props.issuer).send({ from: props.contractor}).then(() => {
            console.log(`Token ${ar.tokenId} Ownership transfered from ${props.contractor} to ${props.issuer}`)
            done();
        }, (error) => {
            try {
                assert.isFalse(error === undefined);
                assert.isNotNull(error);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);
});

describe('Asset Manager V2 Wallet Funding Tests', () => {
    const toTransfer = 50000;
    before(function (done) {
        this.timeout(TIMEOUT);
        unlockAccounts(done);
    });

    it(`Should Fund ${props.user1.address}`, (done) => {
        AssetManagerContract.methods.fundWallet(props.user1.address, toTransfer).send({ from: props.contractor}).then(() => {
            user1WalletBalance += toTransfer;
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should not fund ${props.user2.address} from ${props.user1.address} (only contractor can fund wallets)`, (done) => {
        AssetManagerContract.methods.fundWallet(props.user1.address, toTransfer).send({ from: props.user1.address}).then(() => {
            done();
        }, error => {
            try {
                assert.isFalse(error === undefined);
                assert.isNotNull(error);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it(`Should Fund ${props.user2.address}`, (done) => {
        AssetManagerContract.methods.fundWallet(props.user2.address, toTransfer).send({ from: props.contractor}).then(() => {
            user2WalletBalance += toTransfer;
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user1.address} is funded`, (done) => {
        AssetManagerContract.methods.walletBalance(props.user1.address).call().then((walletBalance) => {
            try {
                console.log(walletBalance);
                console.log(user1WalletBalance);
                assert.equal(+walletBalance, user1WalletBalance);
                done();
            } catch (e) {
                done(e);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user2.address} is funded`, (done) => {
        AssetManagerContract.methods.walletBalance(props.user2.address).call().then((walletBalance) => {
            try {
                console.log(walletBalance);
                console.log(user2WalletBalance);
                assert.equal(+walletBalance, user2WalletBalance);
                done();
            } catch (e) {
                done(e);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);
});

// Order Book Management
describe('Asset Manager V2 Order Book Management Tests: ALL OR NOTHING Orders', () => {
    before(function (done) {
        this.timeout(TIMEOUT);
        unlockAccounts(done);
    });

    // #1 Sell
    it(`It should post a New Sell Order from ${issuer}`, (done) => {
        const orderRequest = getOrderRequestV2(ar.tokenId, OrderType.SELL, OrderStrategy.AON, 1500, 1, 0);
        sellOrder1Key = orderRequest.key;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: issuer}).then(() => {
            console.log("Order Posted");
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should confirm order is successfully posted`, (done) => {
        AssetManagerContract.methods.getOrder(sellOrder1Key).call({ from: props.address }).then((order) => {            
            try {
                assert.equal(order.orderType, OrderType.SELL);
                assert.equal(order.orderStrategy, OrderStrategy.AON);
                assert.equal(order.seller, props.address);
                assert.equal(order.tokenId, ar.tokenId);
                assert.equal(order.originalAmount, 1500);
                assert.equal(order.amountRemaining, 1500);
                assert.equal(order.status, 0);
                assert.equal(order.price, 1);
                done();
            } catch (error) {
                done(error);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    // #1 Buy
    it(`Should post a New Buy Order from ${props.user1.address}`, (done) => {
        const orderRequest = getOrderRequestV2(ar.tokenId, OrderType.BUY, OrderStrategy.AON, 1500, 1, 0);
        buyOrder1Key = orderRequest.key;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address}).then(() => {
            console.log("Order Posted");
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should confirm order is successfully posted and bought`, (done) => {
        AssetManagerContract.methods.getOrder(buyOrder1Key).call({ from: props.address }).then((order) => {
            try {
                assert.equal(order.orderType, OrderType.BUY);
                assert.equal(order.orderStrategy, OrderStrategy.AON);
                assert.equal(order.buyer, props.user1.address);
                assert.equal(order.tokenId, ar.tokenId);
                assert.equal(order.originalAmount, 1500);
                assert.equal(order.amountRemaining, 0);
                assert.equal(order.status, 1);
                assert.equal(order.price, 1);
                done();
            } catch (error) {
                done(error);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT); 
    
    // #2 Sell
    it(`It should post a New Sell Order from ${issuer}`, (done) => {
        const orderRequest = getOrderRequestV2(ar.tokenId, OrderType.SELL, OrderStrategy.AON, 1500, 1, 0);
        sellOrder1Key = orderRequest.key;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: issuer}).then(() => {
            console.log("Order Posted");
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should confirm order is successfully posted`, (done) => {
        AssetManagerContract.methods.getOrder(sellOrder1Key).call({ from: props.address }).then((order) => {            
            try {
                assert.equal(order.orderType, OrderType.SELL);
                assert.equal(order.orderStrategy, OrderStrategy.AON);
                assert.equal(order.seller, props.address);
                assert.equal(order.tokenId, ar.tokenId);
                assert.equal(order.originalAmount, 1500);
                assert.equal(order.amountRemaining, 1500);
                assert.equal(order.status, 0);
                assert.equal(order.price, 1);
                done();
            } catch (error) {
                done(error);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);  
    
    // #2 Buy
    it(`Should post a New Buy Order from ${props.user1.address}`, (done) => {
        const orderRequest = getOrderRequestV2(ar.tokenId, OrderType.BUY, OrderStrategy.AON, 700, 1, 0);
        buyOrder1Key = orderRequest.key;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address}).then(() => {
            console.log("Order Posted");
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should confirm order is successfully posted but not bought`, (done) => {
        AssetManagerContract.methods.getOrder(buyOrder1Key).call({ from: props.address }).then((order) => {
            try {
                assert.equal(order.orderType, OrderType.BUY);
                assert.equal(order.orderStrategy, OrderStrategy.AON);
                assert.equal(order.buyer, props.user1.address);
                assert.equal(order.tokenId, ar.tokenId);
                assert.equal(order.originalAmount, 700);
                assert.equal(order.amountRemaining, 700);
                assert.equal(order.status, 0);
                assert.equal(order.price, 1);
                done();
            } catch (error) {
                done(error);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);     

    // #3 Buy #1
    it(`Should post a New Buy Order from ${props.user1.address}`, (done) => {
        const orderRequest = getOrderRequestV2(ar.tokenId, OrderType.BUY, OrderStrategy.AON, 1500, 1, 0);
        buyOrder1Key = orderRequest.key;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address}).then(() => {
            console.log("Order Posted");
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should confirm order is successfully posted and bought`, (done) => {
        AssetManagerContract.methods.getOrder(buyOrder1Key).call({ from: props.address }).then((order) => {
            try {
                assert.equal(order.orderType, OrderType.BUY);
                assert.equal(order.orderStrategy, OrderStrategy.AON);
                assert.equal(order.buyer, props.user1.address);
                assert.equal(order.tokenId, ar.tokenId);
                assert.equal(order.originalAmount, 1500);
                assert.equal(order.amountRemaining, 0);
                assert.equal(order.status, 1);
                assert.equal(order.price, 1);
                done();
            } catch (error) {
                done(error);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);     

    // #4 Match #2 (SELL)
    it(`It should post a New Sell Order from ${issuer}`, (done) => {
        const orderRequest = getOrderRequestV2(ar.tokenId, OrderType.SELL, OrderStrategy.GTC, 700, 1, 0);
        sellOrder1Key = orderRequest.key;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: issuer}).then(() => {
            console.log("Order Posted");
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should confirm order is successfully posted and sold (matched)`, (done) => {
        AssetManagerContract.methods.getOrder(sellOrder1Key).call({ from: props.address }).then((order) => {            
            try {
                assert.equal(order.orderType, OrderType.SELL);
                assert.equal(order.orderStrategy, OrderStrategy.GTC);
                assert.equal(order.seller, props.issuer);
                assert.equal(order.tokenId, ar.tokenId);
                assert.equal(order.originalAmount, 700);
                assert.equal(order.amountRemaining, 0);
                assert.equal(order.status, 1);
                assert.equal(order.price, 1);
                done();
            } catch (error) {
                done(error);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);
});

describe.skip('Asset Manager V2 Order Book Management Tests: GOOD TILL CANCEL Orders', () => {
    before(function (done) {
        this.timeout(TIMEOUT);
        unlockAccounts(done);
    });

    it(`It should post a New Sell Order from ${issuer}`, (done) => {
        const orderRequest = getOrderRequestV2(ar.tokenId, OrderType.SELL, OrderStrategy.GTC, 1500, 1, 0);
        sellOrder1Key = orderRequest.key;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: issuer}).then(() => {
            console.log("Order Posted");
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should confirm order is successfully posted`, (done) => {
        AssetManagerContract.methods.getOrder(sellOrder1Key).call({ from: props.address }).then((order) => {            
            try {
                assert.equal(order.orderType, OrderType.SELL);
                assert.equal(order.orderStrategy, OrderStrategy.GTC);
                assert.equal(order.seller, props.address);
                assert.equal(order.tokenId, ar.tokenId);
                assert.equal(order.originalAmount, 1500);
                assert.equal(order.amountRemaining, 1500);
                assert.equal(order.status, 0);
                assert.equal(order.price, 1);
                done();
            } catch (error) {
                done(error);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should post a New Buy Order from ${props.user1.address}`, (done) => {
        const orderRequest = getOrderRequestV2(ar.tokenId, OrderType.BUY, OrderStrategy.GTC, 1500, 1, 0);
        buyOrder1Key = orderRequest.key;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address}).then(() => {
            console.log("Order Posted");
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should confirm order is successfully posted and bought`, (done) => {
        AssetManagerContract.methods.getOrder(buyOrder1Key).call({ from: props.address }).then((order) => {
            try {
                assert.equal(order.orderType, OrderType.BUY);
                assert.equal(order.orderStrategy, OrderStrategy.GTC);
                assert.equal(order.buyer, props.user1.address);
                assert.equal(order.tokenId, ar.tokenId);
                assert.equal(order.originalAmount, 1500);
                assert.equal(order.amountRemaining, 0);
                assert.equal(order.status, 1);
                assert.equal(order.price, 1);
                done();
            } catch (error) {
                done(error);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);
});

describe('Asset Manager V2 Asset Transfer Tests', () => {
    const toTransfer = 50000;
    const toTransfer2 = 25000
    const toTransfer3 = 12500;

    before(function (done) {
        this.timeout(TIMEOUT);
        unlockAccounts(done);
    });

    it(`Should transfer asset from issuer to ${props.user1.address}`, (done) => {
        AssetManagerContract.methods.transferShares(ar.tokenId, props.user1.address, toTransfer).send({ from: issuer}).then(() => {
            user1OwnedShares += toTransfer;
            issuerBalance -= toTransfer;
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user1.address} has increased balance`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.user1.address).call().then((ownedShares) => {
            try {
                console.log(ownedShares);
                assert.equal(+ownedShares, user1OwnedShares);
                done();
            } catch (e) {
                done(e);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should make sure issuer has reduced balance`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, issuer).call().then((ownedShares) => {
            try {
                console.log(ownedShares);
                assert.equal(issuerBalance, +ownedShares);
                done();
            } catch (e) {
                done(e);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should transfer asset from issuer to ${props.user2.address}`, (done) => {
        AssetManagerContract.methods.transferShares(ar.tokenId, props.user2.address, toTransfer2).send({ from: issuer}).then(() => {
            user2OwnedShares += toTransfer2
            issuerBalance -= toTransfer2;
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user2.address} has increased balance`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.user2.address).call().then((ownedShares) => {
            try {
                console.log(ownedShares);
                assert.equal(+ownedShares, user2OwnedShares);
                done();
            } catch (e) {
                done(e);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should make sure issuer has reduced balance`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, issuer).call().then((ownedShares) => {
            try {
                console.log(ownedShares);
                assert.equal(issuerBalance, +ownedShares);
                done();
            } catch (e) {
                done(e);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should transfer asset from ${props.user1.address} to ${props.user2.address}`, (done) => {
        AssetManagerContract.methods.transferShares(ar.tokenId, props.user2.address, toTransfer3).send({ from: props.user1.address}).then(() => {
            user1OwnedShares -= toTransfer3;
            user2OwnedShares += toTransfer3;
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user2.address} has increased balance`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.user2.address).call().then((ownedShares) => {
            try {
                console.log(ownedShares);
                assert.equal(+ownedShares, user2OwnedShares);
                done();
            } catch (e) {
                done(e);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user1.address} has reduced balance`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.user1.address).call().then((ownedShares) => {
            try {
                console.log(ownedShares);
                assert.equal(+ownedShares, user1OwnedShares);
                done();
            } catch (e) {
                done(e);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should transfer asset from ${props.user2.address} to ${props.user1.address}`, (done) => {
        AssetManagerContract.methods.transferShares(ar.tokenId, props.user1.address, toTransfer3).send({ from: props.user2.address}).then(() => {
            user1OwnedShares += toTransfer3;
            user2OwnedShares -= toTransfer3;
            done();
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user1.address} has increased balance`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.user1.address).call().then((ownedShares) => {
            try {
                console.log(ownedShares);
                assert.equal(+ownedShares, user1OwnedShares);
                done();
            } catch (e) {
                done(e);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user2.address} has reduced balance`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.user2.address).call().then((ownedShares) => {
            try {
                console.log(ownedShares);
                assert.equal(+ownedShares, user2OwnedShares);
                done();
            } catch (e) {
                done(e);
            }
        }, (error) => {
            done(error);
        });
    }).timeout(TIMEOUT);
});