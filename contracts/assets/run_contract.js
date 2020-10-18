const Web3 = require('web3');
const props = require('../../config/config');
const path = require('path');
const fs = require('fs');

const web3 = new Web3(props.web3URL);
const contractAddress = '0x22e4e1ec483b5504A8b361d32aEb56863194fD00';
const abiPath = '/Users/aardvocate/src/SmartContractCreator/contracts/assets/output/_AssetManager_sol_AssetManager.abi';
const abi = JSON.parse(fs.readFileSync(path.resolve(abiPath), 'utf8'));
const AssetManagerContract = new web3.eth.Contract(abi, contractAddress);

function importAddress() {
    // main mac - default
    //web3.eth.personal.importRawKey(props.privKey, 'Wq017kmg@tm');
    web3.eth.personal.importRawKey(props.user2.privKey, 'Wq017kmg@tm');
    web3.eth.personal.importRawKey(props.user1.privKey, 'Wq017kmg@tm');
}

function processEvents() {
    // to process all past events 
    AssetManagerContract.getPastEvents('allEvents', {
        fromBlock: 0,
        toBlock: 'latest'
    }).then(function (events) {
        for (e of events) {
            console.error(e.event);
            if(e.event == 'DEBUG') {
                console.error(e.returnValues['str']);
            }
        }
    });
}

function createNewAsset(name, desc, callback) {
    const assetRequest = {
        name: name,
        description: desc,
        totalQuantity: 100000000,
        decimal: 2
    }

    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.createAsset(assetRequest).send({ from: props.address }).on('transactionHash', (hash) => {
            callback(hash)
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

function getUserAssets(address, callback) {
    let allAssets = [];
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getUserAssets(address).call({ from: props.address }).then(result => {
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
function postOrder(orderType, orderStrategy, amount, price, assetName, assetIssuer) {
    let value = 0;
    if (orderType === 'BUY') {
        // we must send ether to the smart contract worth how much we are willing to pay
        value = amount * price;
    }

    const orderRequest = {
        orderType: orderType === 'BUY' ? 0 : 1,
        orderStrategy: orderStrategy === 'PARTIAL' ? 0 : 1,
        amount: amount,
        price: price,
        assetName: assetName,
        assetIssuer: assetIssuer,
    }

    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address, value: value }).on('transactionHash', (hash) => {
            console.log(hash);
        });
    });
}

function postOrderWithAddress(address, password, orderType, orderStrategy, amount, price, assetName, assetIssuer) {
    const orderRequest = {
        orderType: orderType === 'BUY' ? 0 : 1,
        orderStrategy: orderStrategy === 'PARTIAL' ? 0 : 1,
        amount: amount,
        price: price,
        assetName: assetName,
        assetIssuer: assetIssuer,
    }

    web3.eth.personal.unlockAccount(address, password).then(() => {
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: address }).on('transactionHash', (hash) => {
            console.log(hash);
        });
    });
}


function getOrders(callback) {
    let allOrders = [];
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getOrders().call({ from: props.address, gas: props.gas, }).then((result) => {
            for (res of result) {
                if (res.id >= 0) {
                    order = {
                        id: res.id,
                        orderType: res.orderType == 0 ? 'BUY' : 'SELL',
                        orderStrategy: res.orderStrategy == 0 ? 'PARTIAL' : 'ALL_OR_NOTHING',
                        seller: res.seller,
                        buyer: res.buyer,
                        assetName: res.assetName,
                        amount: res.amount,
                        price: res.price,
                        matched: res.matched
                    }
                    allOrders.push(order);
                }
            }
            callback(allOrders);
        });
    });
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

function createAssetsMini() {
    createNewAsset('BUD', 'Budweiser', async (hash) => {
        console.log(hash);
        await sleep(5000);
        getAssets((allAssets) => { console.log(allAssets); });
    });
}

async function sleep(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

function transferAsset(address, amount, assetName) {
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.transferAsset(address, assetName, amount).send({ from: props.address }).on('transactionHash', (hash) => {
            console.log(hash);
        });
    });
}

async function start() {
    createAssetsMini();
    await sleep(30000);
    transferAsset(props.user2.address, 3150, "BUD");
    await sleep(1000);
    console.log("posting order 1");    
    postOrder('BUY', 'PARTIAL', 1500, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc');
    await sleep(15000);
    getOrders((allOrders) => { console.log(allOrders) });
}

//start();
//processEvents();
//importAddress();
//createAssets();
// transferAsset(props.user1.address, 200000000, 3);
//transferAsset(props.user2.address, 3150, "BUD");
getAssets((allAssets) => { console.log(allAssets); });
//getIssuedAssets('0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', (allAssets) => {console.log(allAssets)});
//getUserAssets(props.user2.address, (allAssets) => {console.log(allAssets)});
// getUserAssets('0x2D00F0bB90859015E000477053AB1E44a53cB40B', (allAssets) => {console.log(allAssets)});
// price should be in wei
//postOrder('SELL', 'PARTIAL', 1500, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc');
//postOrder('BUY', 'PARTIAL', 783, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc');
//postOrderWithAddress(props.user2.address, props.user2.password, 'SELL', 'PARTIAL', 2000, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc');
//getOrders((allOrders) => { console.log(allOrders) });
 