const Web3 = require('web3');
const props = require('./config/config');
const path = require('path');
const fs = require('fs');
const Utils = require('web3-utils');
const web3 = new Web3(props.web3URL);
const contractAddress = props.contractAddress;
const abiPath = props.abiPath;
const abi = JSON.parse(fs.readFileSync(path.resolve(abiPath), 'utf8'));
const AssetManagerContract = new web3.eth.Contract(abi.abi, contractAddress);

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

function importAddress() {
    // main mac - default
    web3.eth.personal.importRawKey('416923edfd58ab2fe988a317a0a4adb6d89c19abce5816686d9a573073e7ca67', 'Wq017kmg@tm');
    // web3.eth.personal.importRawKey(props.user2.privKey, 'Wq017kmg@tm');
    // web3.eth.personal.importRawKey(props.user1.privKey, 'Wq017kmg@tm');
}

function processEvents() {
    // to process all past events 
    console.log('Processing Events.....');
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.getPastEvents('allEvents', {
            fromBlock: 0,
            toBlock: 'latest'
        }).then(function (events) {
            for (e of events) {
                console.error(e.event);
                if (e.event === 'DEBUG') {
                    console.error(e.returnValues['str']);
                }

                if (e.event === 'AssetCreated') {
                    console.error(e.returnValues['asset']);
                }                
            }
        });
    });
}

function createNewAsset(name, desc, callback) {
    const assetRequest = {
        name: name,
        description: desc,
        totalQuantity: 100000000,
        price: 100,
        decimal: 0
    }

    console.log(assetRequest);
    
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.createAsset(assetRequest).send({ from: props.address }).then(() => {
            callback('Asset Created');
        });
    });
}

function getAssets(callback) {
    let allAssets = [];
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getAssets().call({ from: props.address }).then(result => {
            for (res of result) {
                if (res.id >= 0) {
                    asset = {
                        id: res.id,
                        name: res.name,
                        description: res.description,
                        totalQuantity: res.totalQuantity,
                        quantity: res.quantity,
                        decimal: res.decimal,
                        issuer: res.issuer,
                        owner: res.owner
                    }

                    allAssets.push(asset);
                }
            }
            callback(allAssets);
        });
    });
}

function getIssuedAssets(address, callback) {
    let allAssets = [];
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getIssuedAssets(address).call({ from: props.address }).then(result => {
            for (res of result) {
                if (res.id > 0) {
                    asset = {
                        id: res.id,
                        name: res.name,
                        description: res.description,
                        totalQuantity: res.totalQuantity,
                        quantity: res.quantity,
                        decimal: res.decimal,
                        issuer: res.issuer,
                        owner: res.owner
                    }

                    allAssets.push(asset);
                }
            }
            callback(allAssets);
        });
    });
}

/**
 * 
 * @param {*} orderType 
 * @param {*} amount 
 * @param {*} price 
 * @param {*} assetId 
 */
function postOrder(orderType, orderStrategy, amount, price, assetName, assetIssuer, goodUntil, callback) {
    let value = 0;
    if (orderType === 0) {
        // we must send ether to the smart contract worth how much we are willing to pay
        value = amount * price;
    }

    const key = Utils.soliditySha3(
        { type: 'uint256', value: amount },
        { type: 'uint256', value: price },
        { type: 'string', value: assetName },
        { type: 'address', value: assetIssuer },
        { type: 'address', value: props.address },
        { type: 'uint256', value: new Date().getTime() }
    );

    console.log('KEY: ', key);

    orderRequest = {
        orderType: orderType,
        orderStrategy: orderStrategy,
        amount: amount,
        price: price,
        assetName: assetName,
        assetIssuer: assetIssuer,
        goodUntil: goodUntil,
        key: key
    }

    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address, value: value }).then(() => {
            callback('Order Posted');
        });
    });
}

function postOrderWithAddress(address, password, orderType, orderStrategy, amount, price, assetName, assetIssuer, goodUntil, callback) {

    const key = Utils.soliditySha3(
        { type: 'uint256', value: amount },
        { type: 'uint256', value: price },
        { type: 'string', value: assetName },
        { type: 'address', value: assetIssuer },
        { type: 'address', value: props.address },
        { type: 'uint256', value: new Date().getTime() }
    );

    const orderRequest = {
        orderType: orderType,
        orderStrategy: orderStrategy,
        amount: amount,
        price: price,
        assetName: assetName,
        assetIssuer: assetIssuer,
        goodUntil: goodUntil,
        key: key
    }

    let value = 0;
    if (orderType === 0) {
        // we must send ether to the smart contract worth how much we are willing to pay
        value = amount * price;
    }

    web3.eth.personal.unlockAccount(address, password).then(() => {
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: address, value: value }).then(() => {
            callback('Order Posted');
        });
    });
}


function getOrders(key, callback) {
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getOrders(key).call({ from: props.address, gas: props.gas, }).then((result) => {
            callback(result);
        });
    });
}

function getAllOrders(callback) {
    let allOrders = [];
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getAllOrders().call({ from: props.address, gas: props.gas, }).then((result) => {
            for (res of result) {
                if (res.id >= 0) {
                    order = populateOrder(res);
                    allOrders.push(order);
                }
            }
            callback(allOrders);
        });
    });
}


function getBuyOrders(callback) {
    let allOrders = [];
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getBuyOrders().call({ from: props.address, gas: props.gas, }).then((result) => {
            for (res of result) {
                if (res.id >= 0 && (res.seller !== "0x0000000000000000000000000000000000000000" || res.buyer !== "0x0000000000000000000000000000000000000000")) {
                    order = populateOrder(res);
                    allOrders.push(order);
                }
            }
            callback(allOrders);
        });
    });
}

function getSellOrders(callback) {
    let allOrders = [];
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getSellOrders().call({ from: props.address, gas: props.gas, }).then((result) => {
            for (res of result) {
                if (res.id >= 0 && (res.seller !== "0x0000000000000000000000000000000000000000" || res.buyer !== "0x0000000000000000000000000000000000000000")) {
                    order = populateOrder(res);
                    allOrders.push(order);
                }
            }
            callback(allOrders);
        });
    });
}

function getMatchedOrders(callback) {
    let allOrders = [];
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getMatchedOrders().call({ from: props.address, gas: props.gas, }).then((result) => {
            for (res of result) {
                if (res.id >= 0 && (res.seller !== "0x0000000000000000000000000000000000000000" || res.buyer !== "0x0000000000000000000000000000000000000000")) {
                    order = populateOrder(res);
                    allOrders.push(order);
                }
            }
            callback(allOrders);
        });
    });
}

function getUserOrders(user, callback) {
    let allOrders = [];
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getUserOrders(user).call({ from: props.address, gas: props.gas, }).then((result) => {
            for (res of result) {
                if (res.id >= 0 && (res.seller !== "0x0000000000000000000000000000000000000000" || res.buyer !== "0x0000000000000000000000000000000000000000")) {
                    order = populateOrder(res);
                    allOrders.push(order);
                }
            }
            callback(allOrders);
        });
    });
}

function populateOrder(res) {
    order = {
        id: res.id,
        orderType: res.orderType,
        orderStrategy: res.orderStrategy,
        seller: res.seller,
        buyer: res.buyer,
        assetName: res.assetName,
        amount: res.amount,
        originalAmount: res.originalAmount,
        price: res.price,
        status: res.status,
        index: res.index,
        orderDate: res.orderDate
    }

    return order;
}


function createAssets() {
    createNewAsset('BUD', 'Budweiser', async (hash) => {
        console.log(hash);
        await sleep(5000);
        createNewAsset('HEIN', 'Heineken', async (hash) => {
            console.log(hash);
            await sleep(5000);
            createNewAsset('STAR', 'Star', async (hash) => {
                console.log(hash);
                await sleep(5000);
                createNewAsset('GUIL', 'Guilder', async (hash) => {
                    console.log(hash);
                    await sleep(5000);
                    createNewAsset('TROP', 'Trophy', async (hash) => {
                        console.log(hash);
                        await sleep(5000);
                        getAssets((allAssets) => { console.log(allAssets); });
                    });
                });
            });
        });
    });
}

async function sleep(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

function transferAsset(address, amount, assetName, callback) {
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.transferAsset(address, assetName, amount).send({ from: props.address }).then(() => {
            callback('Asset Transfered');
        });
    });
}


function getUserAssets(address, callback) {
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getUserAssets(address).call({ from: props.address }).then((result) => {
            callback(result);
        });
    });
}

function getBalances(address) {
    let allOrders = [];
    web3.eth.personal.unlockAccount(address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getTokenBalance().call({ from: address, gas: props.gas, }).then((result) => {
            console.log(`${address} Token Balance: ${result}`);
            AssetManagerContract.methods.getEscrowBalance().call({ from: address, gas: props.gas, }).then((result) => {
                console.log(`${address} Escrow Balance: ${result}`);
            });
        });
    });
}

async function start() {
    createNewAsset('BUD', 'Budweiser', (hash) => {
        console.log(hash);
        getAssets((allAssets) => {
            console.log(allAssets);
            transferAsset(props.user1.address, 113150, "BUD", (hash) => {
                console.log(hash);
                postOrder(OrderType.BUY, OrderStrategy.GTC, 1500, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {
                    console.log(hash);
                    postOrderWithAddress(props.user1.address, props.user1.password, OrderType.SELL, OrderStrategy.GTC, 1500, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {
                        console.log(hash);
                        processEvents();
                    });
                });
            });
        });
    });
}

async function testBuyPartial() {
    postOrder(OrderType.BUY, OrderStrategy.GTC, 3000, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {
        console.log(hash);
        postOrderWithAddress(props.user1.address, props.user1.password, OrderType.SELL, OrderStrategy.GTC, 700, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {
            postOrderWithAddress(props.user1.address, props.user1.password, OrderType.SELL, OrderStrategy.GTC, 700, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {
                postOrderWithAddress(props.user2.address, props.user2.password, OrderType.SELL, OrderStrategy.GTC, 700, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {
                    postOrderWithAddress(props.user2.address, props.user2.password, OrderType.SELL, OrderStrategy.GTC, 900, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {
                        console.log(hash);
                    });                                                
                    console.log(hash);
                });                            
                console.log(hash);
            });            
            console.log(hash);
        });
    });    
}

//importAddress();
//start();
//testBuyPartial();
processEvents();
//getBalances(props.address);
//getBalances(props.user1.address);
//getBalances(props.user2.address);
//postOrder(OrderType.BUY, OrderStrategy.GTC, 1700, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {console.log(hash);});
//postOrderWithAddress(props.user1.address, props.user1.password, OrderType.BUY, OrderStrategy.GTC, 1700, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {console.log(hash);});
//postOrderWithAddress(props.user1.address, props.user1.password, OrderType.SELL, OrderStrategy.MO, 3700, 10, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {console.log(hash);});
//getOrders("PENDING_ORDERS", (allOrders) => { console.log(allOrders); console.log(allOrders.length) });
//getOrders("BUY_ORDERS", (allOrders) => { console.log(allOrders) });
 //getOrders("SELL_ORDERS", (allOrders) => { console.log(allOrders) });
//getOrders("MATCHED_ORDERS", (allOrders) => { console.log(allOrders) });
//getOrders("DELETED_ORDERS", (allOrders) => { console.log(allOrders) });
//getUserOrders(props.user1.address, (allOrders) => {console.log(allOrders)})s;