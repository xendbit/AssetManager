const Web3 = require('web3');
const props = require('../config/config');
const path = require('path');
const fs = require('fs');
const web3 = new Web3(props.web3URL);
const contractAddress = props.v2.contractAddress;
const abiPath = props.v2.abiPath;
const abi = JSON.parse(fs.readFileSync(path.resolve(abiPath), 'utf8'));
const AssetManagerContract = new web3.eth.Contract(abi.abi, contractAddress);
const TIMEOUT = 60000;
const { assert } = require('chai');
const { unlockAccounts } = require('./test_utils.js');

const ar = {
    tokenId: Math.floor(Math.random() * 100000000),
    name: 'Test Asset',
    symbol: 'TAX',
    totalQuantity: 1000000,
    price: 10,
    issuer: props.address
};

const ar2 = {
    name: 'Test Asset',
    tokenId: Math.floor(Math.random() * 100000000),
    symbol: 'TAX',
    totalQuantity: 1000000,
    price: 10,
    issuer: props.address
};

const issuer = props.address;
let issuerBalance = 0;
let issuerWalletBalance = 0;

let user1WalletBalance = 0;
let user2WalletBalance = 0;

let user1OwnedShares = 0;
let user2OwnedShares = 0;

describe('Asset Manager V2 Minting Test', () => {
    before(function (done) {
        this.timeout(TIMEOUT);
        unlockAccounts(done);
    });

    it('Should mint a new token', (done) => {
        AssetManagerContract.methods.mint(ar).send({ from: props.contractor }).then(() => {
            console.log('Asset Minted');
            issuerBalance += ar.totalQuantity;
            done();
        });
    }).timeout(TIMEOUT);

    it('Should not mint a new token (token id must be unique)', (done) => {
        AssetManagerContract.methods.mint(ar).send({ from: props.contractor }).then(() => {
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
        AssetManagerContract.methods.mint(ar2).send({ from: props.address }).then(() => {
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
        AssetManagerContract.methods.sharesContract(ar.tokenId).call().then((sca) => {
            try {
                // Result {
                //     '0': '0x728315F1bA7954E8263CC0B203D21C8953bd11D9',
                //     '1': '12331059',
                //     '2': 'Test Asset',
                //     '3': 'TAX',
                //     '4': '1000000',
                //     '5': '10' }                                
                assert.notEqual(sca[0], "0x0000000000000000000000000000000000000000");
                assert.equal(sca[1], ar.tokenId);
                assert.equal(sca[2], ar.name);
                assert.equal(sca[3], ar.symbol);
                assert.equal(sca[4], ar.totalQuantity);
                assert.equal(sca[5], ar.price);
                done();
            } catch (e) {
                done(e);
            }
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
    });
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
        AssetManagerContract.methods.transferShares(ar.tokenId, props.user1.address, toTransfer).send({ from: issuer }).then(() => {
            user1OwnedShares += toTransfer;
            issuerBalance -= toTransfer;
            done();
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
        });
    }).timeout(TIMEOUT);

    it(`Should transfer asset from issuer to ${props.user2.address}`, (done) => {
        AssetManagerContract.methods.transferShares(ar.tokenId, props.user2.address, toTransfer2).send({ from: issuer }).then(() => {
            user2OwnedShares += toTransfer2
            issuerBalance -= toTransfer2;
            done();
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
        });
    }).timeout(TIMEOUT);

    it(`Should transfer asset from ${props.user1.address} to ${props.user2.address}`, (done) => {
        AssetManagerContract.methods.transferShares(ar.tokenId, props.user2.address, toTransfer3).send({ from: props.user1.address }).then(() => {
            user1OwnedShares -= toTransfer3;
            user2OwnedShares += toTransfer3;
            done();
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
        });
    }).timeout(TIMEOUT);

    it(`Should transfer asset from ${props.user2.address} to ${props.user1.address}`, (done) => {
        AssetManagerContract.methods.transferShares(ar.tokenId, props.user1.address, toTransfer3).send({ from: props.user2.address }).then(() => {
            user1OwnedShares += toTransfer3;
            user2OwnedShares -= toTransfer3;
            done();
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
        AssetManagerContract.methods.fundWallet(props.user1.address, toTransfer).send({ from: props.contractor }).then(() => {
            user1WalletBalance += toTransfer;
            done();
        });
    }).timeout(TIMEOUT);

    it(`Should not fund ${props.user2.address} from ${props.user1.address} (only contractor can fund wallets)`, (done) => {
        AssetManagerContract.methods.fundWallet(props.user1.address, toTransfer).send({ from: props.user1.address }).then(() => {
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
        AssetManagerContract.methods.fundWallet(props.user2.address, toTransfer).send({ from: props.contractor }).then(() => {
            user2WalletBalance += toTransfer;
            done();
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
        });
    }).timeout(TIMEOUT);
});

describe('Asset Manager V2 Buy Tests', () => {
    const shares = 200;
    const price = 10;
    const cost = shares * price;

    before(function (done) {
        this.timeout(TIMEOUT);
        unlockAccounts(done);
    });

    /** User 1 to User 2 */
    // -----------------------------------------------
    it(`Should use ${props.user1.address} to buy asset from ${props.user2.address}`, (done) => {
        AssetManagerContract.methods.buyShares(ar.tokenId, props.user2.address, shares, price).send({ from: props.user1.address }).then(() => {
            user1OwnedShares += shares;
            user1WalletBalance -= cost;
            user2OwnedShares -= shares;
            user2WalletBalance += cost;
            done();
        })
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user1.address} asset balance increased`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.user1.address).call().then((ownedShares) => {
            console.log(ownedShares);
            try {
                assert.equal(+ownedShares, user1OwnedShares);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user2.address} asset balance decreased`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.user2.address).call().then((ownedShares) => {
            console.log(ownedShares);
            try {
                assert.equal(+ownedShares, user2OwnedShares);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user1.address} wallet balance decreased`, (done) => {
        AssetManagerContract.methods.walletBalance(props.user1.address).call().then((walletBalance) => {
            try {
                console.log(walletBalance);
                assert.equal(+walletBalance, user1WalletBalance);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user2.address} wallet balance increased`, (done) => {
        AssetManagerContract.methods.walletBalance(props.user2.address).call().then((walletBalance) => {
            try {
                console.log(walletBalance);
                assert.equal(+walletBalance, user2WalletBalance);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);
    // -----------------------------------------------

    /** User 2 to  User 1*/
    // -----------------------------------------------

    it(`Should use ${props.user2.address} to buy asset from ${props.user1.address}`, (done) => {
        AssetManagerContract.methods.buyShares(ar.tokenId, props.user1.address, shares, price).send({ from: props.user2.address }).then(() => {
            user2OwnedShares += shares;
            user2WalletBalance -= cost;
            user1OwnedShares -= shares;
            user1WalletBalance += cost;
            done();
        })
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user2.address} asset balance increased`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.user2.address).call().then((ownedShares) => {
            console.log(ownedShares);
            try {
                assert.equal(+ownedShares, user2OwnedShares);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user2.address} wallet balance decreased`, (done) => {
        AssetManagerContract.methods.walletBalance(props.user2.address).call().then((walletBalance) => {
            try {
                console.log(walletBalance);
                assert.equal(+walletBalance, user2WalletBalance);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user1.address} asset balance decreased`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.user1.address).call().then((ownedShares) => {
            console.log(ownedShares);
            try {
                assert.equal(+ownedShares, user1OwnedShares);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user1.address} wallet balance increased`, (done) => {
        AssetManagerContract.methods.walletBalance(props.user1.address).call().then((walletBalance) => {
            try {
                console.log(walletBalance);
                assert.equal(+walletBalance, user1WalletBalance);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);    
    // -----------------------------------------------

    /** User 1 to  Issuer */
    // -----------------------------------------------

    it(`Should use ${props.user1.address} to buy asset from issuer}`, (done) => {
        AssetManagerContract.methods.buyShares(ar.tokenId, issuer, shares, price).send({ from: props.user1.address }).then(() => {
            user1OwnedShares += shares;
            user1WalletBalance -= cost;
            issuerBalance -= shares;
            issuerWalletBalance += cost;
            done();
        })
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user1.address} asset balance increased`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.user1.address).call().then((ownedShares) => {
            console.log(ownedShares);
            try {
                assert.equal(+ownedShares, user1OwnedShares);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it(`Should make sure issuer asset balance decreased`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, issuer).call().then((ownedShares) => {
            console.log(ownedShares);
            try {
                assert.equal(+ownedShares, issuerBalance);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);


    it(`Should make sure ${props.user1.address} wallet balance decreased`, (done) => {
        AssetManagerContract.methods.walletBalance(props.user1.address).call().then((walletBalance) => {
            try {
                console.log(walletBalance);
                assert.equal(+walletBalance, user1WalletBalance);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it(`Should make sure issuer wallet balance increased`, (done) => {
        AssetManagerContract.methods.walletBalance(issuer).call().then((walletBalance) => {
            try {
                console.log(walletBalance);
                assert.equal(+walletBalance, issuerWalletBalance);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);
    
    // -----------------------------------------------

    /** Issuer to  User 1 */
    // -----------------------------------------------

    it(`Should use issuer to buy asset from ${props.user1.address}`, (done) => {
        AssetManagerContract.methods.buyShares(ar.tokenId, props.user1.address, shares, price).send({ from: issuer }).then(() => {
            issuerBalance += shares;
            issuerWalletBalance -= cost;            
            user1OwnedShares -= shares;
            user1WalletBalance += cost;
            done();
        }, error => {
            console.log(error);
            done(error);
        })
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user1.address} asset balance decreased`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, props.user1.address).call().then((ownedShares) => {
            console.log(ownedShares);
            try {
                assert.equal(+ownedShares, user1OwnedShares);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it(`Should make sure ${props.user1.address} wallet balance increased`, (done) => {
        AssetManagerContract.methods.walletBalance(props.user1.address).call().then((walletBalance) => {
            try {
                console.log(walletBalance);
                assert.equal(+walletBalance, user1WalletBalance);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it(`Should make sure issuer asset balance increased`, (done) => {
        AssetManagerContract.methods.ownedShares(ar.tokenId, issuer).call().then((ownedShares) => {
            console.log(ownedShares);
            try {
                assert.equal(+ownedShares, issuerBalance);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);

    it(`Should make sure issuer wallet balance decreased`, (done) => {
        AssetManagerContract.methods.walletBalance(issuer).call().then((walletBalance) => {
            try {
                console.log(walletBalance);
                assert.equal(+walletBalance, issuerWalletBalance);
                done();
            } catch (e) {
                done(e);
            }
        });
    }).timeout(TIMEOUT);    
});