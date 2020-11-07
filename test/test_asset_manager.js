const Web3 = require('web3');
const props = require('../config/config');
const path = require('path');
const fs = require('fs');
const { assert, expect } = require('chai');

const web3 = new Web3(props.web3URL);
const contractAddress = props.contractAddress;
const abi = JSON.parse(fs.readFileSync(path.resolve(props.abiPath), 'utf8'));
const AssetManagerContract = new web3.eth.Contract(abi.abi, contractAddress);
AssetManagerContract.handleRevert = true;
const TIMEOUT = 120000;
let toMatchKey = undefined;

const { OrderStrategy, OrderType, getAssets, getOrder, getOrderRequest, testAsset, testOrder, unlockAccounts } = require('./test_utils.js');

describe.skip('AssetManager Assets & Tokens Tests', () => {
    before(function (done) {
        this.timeout(TIMEOUT);
        unlockAccounts(done);
    });

    it('should create new asset', (done) => {
        const assetRequest = {
            name: 'BUD',
            description: 'Budweissser',
            totalQuantity: 100000000,
            price: 1,
            decimal: 2
        }
        AssetManagerContract.methods.createAsset(assetRequest).send({ from: props.address }).then(() => {
            console.log("Asset Created");
            getAssets((result) => {
                let asset = result[0];
                testAsset(asset);
                done();
            });
        });
    }).timeout(TIMEOUT);

    it('should transfer token', (done) => {
        let address = props.user1.address;
        let amount = 50000;
        AssetManagerContract.methods.transferToken(address, amount).send({ from: props.contractor }).then(() => {
            console.log("Token Transfered");
            AssetManagerContract.methods.getTokenBalance().call({ from: address }).then(result => {
                console.log("Token Balance: ", result);
                result = +result;
                expect(result).to.be.gte(25000);
                done();
            });
        });
    }).timeout(TIMEOUT);


    it('should transfer token', (done) => {
        let address = props.user2.address;
        let amount = 50000;
        AssetManagerContract.methods.transferToken(address, amount).send({ from: props.contractor }).then(() => {
            console.log("Token Transfered");
            AssetManagerContract.methods.getTokenBalance().call({ from: address }).then(result => {
                console.log("Token Balance: ", result);
                result = +result;
                expect(result).to.be.gte(25000);
                done();
            });
        });
    }).timeout(TIMEOUT);

    it(`should transfer asset to ${props.user1.address}`, (done) => {
        let address = props.user1.address;
        let assetName = 'BUD';
        let assetIssuer = props.address;
        let amount = 25000;
        let price = 1;
        AssetManagerContract.methods.transferAsset(address, assetName, assetIssuer, amount, price).send({ from: props.address }).then(() => {
            console.log("Asset Transfered");
            getAssets((result) => {
                let asset = result[result.length - 1];
                testAsset(asset);
                expect(asset).to.have.property("quantity");
                done();
            })
        });
    }).timeout(TIMEOUT);

    it(`should transfer asset to ${props.user2.address}`, (done) => {
        let address = props.user2.address;
        let assetName = 'BUD';
        let assetIssuer = props.address;
        let amount = 25000;
        let price = 1;
        AssetManagerContract.methods.transferAsset(address, assetName, assetIssuer, amount, price).send({ from: props.address }).then(() => {
            console.log("Asset Transfered");
            getAssets((result) => {
                let asset = result[result.length - 1];
                testAsset(asset);
                expect(asset).to.have.property("quantity");
                let q = +asset['quantity'];
                console.log(q);
                expect(q).to.be.gte(amount);
                done();
            })
        });
    }).timeout(TIMEOUT);
});

describe.skip('AssetManager Normal Orders Test', () => {
    before(function (done) {
        this.timeout(TIMEOUT);
        unlockAccounts(done);
    });

    it('should post (BUY) an order', (done) => {
        const orderRequest = getOrderRequest(OrderType.BUY, OrderStrategy.GTC, 1500, 1, 'BUD', props.address, 0, props.address);
        const value = 1500;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address, value: value }).then(() => {
            console.log(`Order Posted`);
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                assert.equal(+order.status, 0);
                toMatchKey = order.key.key;
                done();
            });
        });
    }).timeout(TIMEOUT);

    it('should match (SELL) previous order', (done) => {
        const orderRequest = getOrderRequest(OrderType.SELL, OrderStrategy.GTC, 1500, 1, 'BUD', props.address, 0, props.user1.address);
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address }).then(() => {
            console.log(`Order Posted`);
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, 0);
                assert.equal(+order.originalAmount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                assert.equal(+order.status, 1);
                if (toMatchKey !== undefined) {
                    getOrder(toMatchKey, (order) => {
                        testOrder(order);
                        assert.equal(+order.amount, 0);
                        assert.equal(+order.originalAmount, orderRequest.amount);
                        assert.equal(+order.price, orderRequest.price);        
                        assert.equal(+order.status, 1);
                    });
                }
                done();
            });
        });
    }).timeout(TIMEOUT);
});

describe.skip('AssetManager ALL OR NOTHING Orders Test', () => {
    before(function (done) {
        this.timeout(TIMEOUT);
        unlockAccounts(done);
    });
    
    it('should post (BUY) ALL_OR_NOTHING order', (done) => {
        const orderRequest = getOrderRequest(OrderType.BUY, OrderStrategy.AON, 1500, 1, 'BUD', props.address, 0, props.address);
        const value = 1500;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address, value: value }).then(() => {
            console.log("Order Posted");
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                assert.equal(+order.status, 0);
                toMatchKey = order.key.key;
                done();
            });
        });
    }).timeout(TIMEOUT);

    it('should match (SELL) ALL_OR_NOTHING order', (done) => {
        const orderRequest = getOrderRequest(OrderType.SELL, OrderStrategy.AON, 1500, 1, 'BUD', props.address, 0, props.user1.address);
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address }).then(() => {
            console.log(`Order Posted`);
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, 0);
                assert.equal(+order.originalAmount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                assert.equal(+order.status, 1);
                if (toMatchKey !== undefined) {
                    getOrder(toMatchKey, (order) => {
                        testOrder(order);
                        assert.equal(+order.amount, 0);
                        assert.equal(+order.originalAmount, orderRequest.amount);
                        assert.equal(+order.price, orderRequest.price);        
                        assert.equal(+order.status, 1);
                    });
                }
                done();
            });
        });
    }).timeout(TIMEOUT);

    it('should post (BUY) ALL_OR_NOTHING order', (done) => {
        const orderRequest = getOrderRequest(OrderType.BUY, OrderStrategy.AON, 1500, 1, 'BUD', props.address, 0, props.address);
        const value = 1500;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address, value: value }).then(() => {
            console.log("Order Posted");
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                assert.equal(+order.status, 0);
                toMatchKey = order.key.key;
                done();
            });
        });
    }).timeout(TIMEOUT);

    it ('should NOT match (SELL) ALL_OR_NOTHING order', (done) => {
        const orderRequest = getOrderRequest(OrderType.SELL, OrderStrategy.AON, 1700, 1, 'BUD', props.address, 0, props.user1.address);
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address }).then(() => {
            console.log("Order Posted");
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                assert.equal(+order.status, 0);
                done();
            });
        });
    }).timeout(TIMEOUT);

    it('should match (SELL) ALL_OR_NOTHING order', (done) => {
        const orderRequest = getOrderRequest(OrderType.SELL, OrderStrategy.AON, 1500, 1, 'BUD', props.address, 0, props.user1.address);
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address }).then(() => {
            console.log(`Order Posted`);
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, 0);
                assert.equal(+order.originalAmount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                assert.equal(+order.status, 1);
                if (toMatchKey !== undefined) {
                    getOrder(toMatchKey, (order) => {
                        testOrder(order);
                        assert.equal(+order.amount, 0);
                        assert.equal(+order.originalAmount, orderRequest.amount);
                        assert.equal(+order.price, orderRequest.price);
                        assert.equal(+order.status, 1);
                    });
                }
                done();
            });
        });
    }).timeout(TIMEOUT);
});

describe.skip('AssetManager Partial Fufil Orders Test', () => {
    before(function (done) {
        this.timeout(TIMEOUT);
        unlockAccounts(done);
    });

    it.skip('should cancel all pending orders', (done) => {        
        AssetManagerContract.methods.getOrderKeys("PENDING_ORDERS").call({ from: props.address }).then(result => {
            for(res of result) {
                AssetManagerContract.methods.cancelOrder(res).send({ from: props.address }).then(() => {
                    console.log(`Order ${res} cancelled`);                    
                });                
            }
            done();
        });
    }).timeout(TIMEOUT);

    it('should post (BUY) an order', (done) => {
        const orderRequest = getOrderRequest(OrderType.BUY, OrderStrategy.GTC, 1000, 1, 'BUD', props.address, 0, props.address);
        const value = 1000;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address, value: value }).then(() => {
            console.log(`Order Posted`);
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                toMatchKey = order.key.key;
                done();
            });
        });
    }).timeout(TIMEOUT);

    it('should partially match (SELL) previous order', (done) => {
        const orderRequest = getOrderRequest(OrderType.SELL, OrderStrategy.GTC, 300, 1, 'BUD', props.address, 0, props.user1.address);
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address }).then(() => {
            console.log(`Order Posted`);
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, 0);
                assert.equal(+order.originalAmount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                assert.equal(+order.status, 1);    
                if (toMatchKey !== undefined) {
                    getOrder(toMatchKey, (order) => {
                        testOrder(order);
                        assert.equal(+order.amount, 700);
                        assert.equal(+order.originalAmount, 1000);
                        assert.equal(+order.price, orderRequest.price);        
                        assert.equal(+order.status, 0);    
                    });
                }
                done();
            });
        });
    }).timeout(TIMEOUT);    

    it('should match (SELL) previous order', (done) => {
        const orderRequest = getOrderRequest(OrderType.SELL, OrderStrategy.GTC, 700, 1, 'BUD', props.address, 0, props.user1.address);
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address }).then(() => {
            console.log(`Order Posted`);
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, 0);
                assert.equal(+order.originalAmount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                assert.equal(+order.status, 1);    
                if (toMatchKey !== undefined) {
                    getOrder(toMatchKey, (order) => {
                        testOrder(order);
                        assert.equal(+order.amount, 0);
                        assert.equal(+order.originalAmount, 1000);
                        assert.equal(+order.price, orderRequest.price);        
                        assert.equal(+order.status, 1);    
                    });
                }
                done();
            });
        });
    }).timeout(TIMEOUT);        
});

describe.skip('AssetManager Market Orders (Sell at any price) Test', () => {
    before(function (done) {
        this.timeout(TIMEOUT);
        unlockAccounts(done);
    });

    it('should post (BUY) an order', (done) => {
        const orderRequest = getOrderRequest(OrderType.BUY, OrderStrategy.GTC, 1000, 2, 'BUD', props.address, 0, props.address);
        const value = 2000;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address, value: value }).then(() => {
            console.log(`Order Posted`);
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                done();
            });
        });
    }).timeout(TIMEOUT);

    it('should post another (BUY) an order', (done) => {
        const orderRequest = getOrderRequest(OrderType.BUY, OrderStrategy.GTC, 1000, 1, 'BUD', props.address, 0, props.address);
        const value = 1000;
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address, value: value }).then(() => {
            console.log(`Order Posted`);
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                toMatchKey = order.key.key;
                done();
            });
        });
    }).timeout(TIMEOUT);
    
    it('should match (SELL) previous order', (done) => {
        const orderRequest = getOrderRequest(OrderType.SELL, OrderStrategy.MO, 700, 10, 'BUD', props.address, 0, props.user1.address);
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address }).then(() => {
            console.log(`Order Posted`);
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, 0);
                assert.equal(+order.originalAmount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                assert.equal(+order.status, 1);    
                if (toMatchKey !== undefined) {
                    getOrder(toMatchKey, (order) => {
                        testOrder(order);
                        assert.equal(+order.amount, 300);
                        assert.equal(+order.originalAmount, 1000);
                        assert.equal(+order.price, 1);        
                        assert.equal(+order.status, 0);    
                        done();
                    });
                }                
            });
        });
    }).timeout(TIMEOUT);

    it('should match (SELL) previous order', (done) => {
        const orderRequest = getOrderRequest(OrderType.SELL, OrderStrategy.MO, 700, 7, 'BUD', props.address, 0, props.user1.address);
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address }).then(() => {
            console.log(`Order Posted`);
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, 0);
                assert.equal(+order.originalAmount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                assert.equal(+order.status, 1);    
                if (toMatchKey !== undefined) {
                    getOrder(toMatchKey, (order) => {
                        testOrder(order);
                        assert.equal(+order.amount, 0);
                        assert.equal(+order.originalAmount, 1000);
                        assert.equal(+order.price, 1);        
                        assert.equal(+order.status, 1);    
                        done();
                    });
                }                
            });
        });
    }).timeout(TIMEOUT);  
    
    it('should match (SELL) previous order', (done) => {
        const orderRequest = getOrderRequest(OrderType.SELL, OrderStrategy.MO, 700, 5, 'BUD', props.address, 0, props.user1.address);
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.user1.address }).then(() => {
            console.log(`Order Posted`);
            getOrder(orderRequest.key, (order) => {
                testOrder(order);
                assert.equal(+order.amount, 100);
                assert.equal(+order.originalAmount, orderRequest.amount);
                assert.equal(+order.price, orderRequest.price);
                assert.equal(+order.status, 0);                    
                done();
            });            
        });
    }).timeout(TIMEOUT);    
});