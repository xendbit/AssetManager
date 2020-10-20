const Web3 = require('web3');
const props = require('../config/config');
const path = require('path');
const fs = require('fs');
const { assert, expect } = require('chai');

const web3 = new Web3(props.web3URL);
const contractAddress = props.contractAddress;
const abiPath = '/Users/aardvocate/src/SmartContractCreator/build/contracts/AssetManager.json';
const abi = JSON.parse(fs.readFileSync(path.resolve(abiPath), 'utf8'));
const AssetManagerContract = new web3.eth.Contract(abi.abi, contractAddress);
const TIMEOUT = 120000;

function getAssets(callback) {
    AssetManagerContract.methods.getAssets().call({ from: props.address }).then(result => {
        expect(result).to.be.a("array").to.have.length.above(0);
        callback(result);
    });    
}

function getOrders(callback) {
    AssetManagerContract.methods.getOrders().call({ from: props.address }).then(result => {
        expect(result).to.be.an("array");
        callback(result);
    });    
}

function getFilteredOrders(key, callback) {
    if(key === 'BUY') {
        AssetManagerContract.methods.getBuyOrders().call({ from: props.address }).then(result => {
            expect(result).to.be.an("array");
            callback(result);
        });        
    } else if(key === 'SELL') {
        AssetManagerContract.methods.getSellOrders().call({ from: props.address }).then(result => {
            expect(result).to.be.an("array");
            callback(result);
        });                
    } else if(key === 'MATCHED') {
        AssetManagerContract.methods.getMatchedOrders().call({ from: props.address }).then(result => {
            expect(result).to.be.an("array");
            callback(result);
        });                
    } else if(key.indexOf('0x') === 0) {
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
}

function testAsset(asset) {    
    expect(asset).to.have.property("name").to.equal('BUD');
    expect(asset).to.have.property("issuer");
    expect(asset).to.have.property("owner");
    expect(asset).to.have.property("decimal").to.equal('2');
}

describe('AssetManager Tests', () => {
    it('should create new asset', (done) => {
        const assetRequest = {
            name: 'BUD',
            description: 'Budweissser',
            totalQuantity: 100000000,
            decimal: 2
        }

        web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
            AssetManagerContract.methods.createAsset(assetRequest).send({ from: props.address }).then(() => {
                console.log("Asset Created");
                getAssets((result) => {
                    let asset = result[0];
                    testAsset(asset);
                    done()            
                });
            })
        });
    }).timeout(TIMEOUT);

    it('should transfer asset', (done) => {
        let address = props.user1.address;
        let assetName = 'BUD';
        let amount = 31251;
        web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
            AssetManagerContract.methods.transferAsset(address, assetName, amount).send({ from: props.address }).then(() => {
                console.log("Asset Transfered");
                getAssets((result) => {
                    let asset = result[result.length - 1];
                    testAsset(asset);                    
                    expect(asset).to.have.property("quantity");
                    let q = +asset['quantity'];
                    expect(q).to.be.gte(3125);
                    done();
                })
            });
        });                
    }).timeout(TIMEOUT);

    it('should transfer token', (done) => {
        let address = props.user1.address;
        let amount = 23451;
        web3.eth.personal.unlockAccount(props.contractor, 'Wq017kmg@tm').then(() => {
            AssetManagerContract.methods.transferToken(address, amount).send({ from: props.contractor }).then(() => {
                console.log("Token Transfered");
                web3.eth.personal.unlockAccount(address, 'Wq017kmg@tm').then(() => {
                    AssetManagerContract.methods.getTokenBalance().call({ from: address }).then(result => {
                        console.log("Token Balance: ", result);
                        result = +result;
                        expect(result).to.be.gte(2345);
                        done();
                    });
                });
            })
        });
    }).timeout(TIMEOUT);

    it('should post (BUY) an order', (done) => {
        const orderRequest = {
            orderType: 0,
            orderStrategy: 0,
            amount: 1500,
            price: 1,
            assetName: 'BUD',
            assetIssuer: props.address,
        }
        
        const value = 1500;
        web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
            AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address, value: value }).then(() => {
                console.log("Order Posted");
                getOrders((orders) => {
                    let order = orders[orders.length - 1];
                    testOrder(order);
                    assert.equal(+order.amount, 1500, "order amount should be 1500");
                    assert.equal(+order.price, 1, "order price should be 1");
                    done();
                })
            });
        });        
    }).timeout(TIMEOUT);

    it('should match (SELL) previous order', (done) => {
        const orderRequest = {
            orderType: 1,
            orderStrategy: 0,
            amount: 1500,
            price: 1,
            assetName: 'BUD',
            assetIssuer: props.address,
        }
        
        const value = 1500;
        web3.eth.personal.unlockAccount(props.user1.address, 'Wq017kmg@tm').then(() => {
            AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address }).then(() => {
                console.log("Order Posted");
                getOrders((orders) => {
                    expect(orders).to.be.an("array");
                    done();
                });
            });
        });        
    }).timeout(TIMEOUT);    

    it('should post (BUY) ALL_OR_NOTHING order', (done) => {
        const orderRequest = {
            orderType: 0,
            orderStrategy: 1, // ALL OR NOTHING
            amount: 1500,
            price: 1,
            assetName: 'BUD',
            assetIssuer: props.address,
        }
        
        const value = 1500;
        web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
            AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address, value: value }).then(() => {
                console.log("Order Posted");
                getOrders((orders) => {
                    let order = orders[orders.length - 1];
                    testOrder(order);
                    assert.equal(+order.amount, 1500, "order amount should be 1500");
                    assert.equal(+order.price, 1, "order price should be 1");
                    done();
                })
            });
        });        
    }).timeout(TIMEOUT);

    it('should match (SELL) ALL_OR_NOTHING order', (done) => {
        const orderRequest = {
            orderType: 1,
            orderStrategy: 1, // ALL OR NOTHING, SHOULD MATCH
            amount: 1500,
            price: 1,
            assetName: 'BUD',
            assetIssuer: props.address,
        }
        
        const value = 1500;
        web3.eth.personal.unlockAccount(props.user1.address, 'Wq017kmg@tm').then(() => {
            AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address }).then(() => {
                console.log("Order Posted");
                getOrders((orders) => {
                    expect(orders).to.be.an("array");
                    done();
                });
            });
        });        
    }).timeout(TIMEOUT);  
    
    it('should post (BUY) ALL_OR_NOTHING order', (done) => {
        const orderRequest = {
            orderType: 0,
            orderStrategy: 1, // ALL OR NOTHING
            amount: 1500,
            price: 1,
            assetName: 'BUD',
            assetIssuer: props.address,
        }
        
        const value = 1500;
        web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
            AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address, value: value }).then(() => {
                console.log("Order Posted");
                getOrders((orders) => {
                    let order = orders[orders.length - 1];
                    testOrder(order);
                    assert.equal(+order.amount, 1500, "order amount should be 1500");
                    assert.equal(+order.price, 1, "order price should be 1");
                    done();
                })
            });
        });        
    }).timeout(TIMEOUT);  
    
    it('should NOT match (SELL) ALL_OR_NOTHING order', (done) => {
        const orderRequest = {
            orderType: 1,
            orderStrategy: 1, // ALL OR NOTHING, SHOULD MATCH
            amount: 1700,
            price: 1,
            assetName: 'BUD',
            assetIssuer: props.address,
        }
        
        web3.eth.personal.unlockAccount(props.user1.address, 'Wq017kmg@tm').then(() => {
            AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address }).then(() => {
                console.log("Order Posted");
                getOrders((orders) => {
                    let order = orders[orders.length - 1];
                    testOrder(order);
                    assert.equal(+order.amount, 1700, "order amount should be 0, it would not have been matched");
                    assert.equal(+order.originalAmount, 1700, "order original amount should still be 1500");
                    assert.equal(+order.price, 1, "order price should be 1");
                    assert.isFalse(order.matched, "order should NOT be matched");
                    done();
                })
            });
        });        
    }).timeout(TIMEOUT);     
    
    it('should match (SELL) ALL_OR_NOTHING order', (done) => {
        const orderRequest = {
            orderType: 1,
            orderStrategy: 1, // ALL OR NOTHING, SHOULD MATCH
            amount: 1500,
            price: 1,
            assetName: 'BUD',
            assetIssuer: props.address,
        }
        
        const value = 1500;
        web3.eth.personal.unlockAccount(props.user1.address, 'Wq017kmg@tm').then(() => {
            AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address }).then(() => {
                console.log("Order Posted");                
                getOrders((orders) => {
                    expect(orders).to.be.an("array");
                    done();
                })
            });
        });        
    }).timeout(TIMEOUT);     
    
    // it('should get buy orders', (done) => {
    //     web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
    //         getFilteredOrders('BUY', (orders) => {
    //             expect(orders).to.be.an("array").with.length.above(0);
    //             done();
    //         });
    //     });
    // }).timeout(TIMEOUT);
    // it('should get sell orders', (done) => {
    //     web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
    //         getFilteredOrders('SELL', (orders) => {
    //             expect(orders).to.be.an("array").with.length.above(0);
    //             done();
    //         });
    //     });
    // }).timeout(TIMEOUT);
    // it('should get matched orders', (done) => {
    //     web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
    //         getFilteredOrders('MATCHED', (orders) => {
    //             expect(orders).to.be.an("array").with.length.above(0);
    //             done();
    //         });
    //     });
    // }).timeout(TIMEOUT);
    // it('should get user orders', (done) => {
    //     web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
    //         getFilteredOrders(props.address, (orders) => {
    //             expect(orders).to.be.an("array").with.length.above(0);
    //             done();
    //         });
    //     });
    // }).timeout(TIMEOUT);    
});