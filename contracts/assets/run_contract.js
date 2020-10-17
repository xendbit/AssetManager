const Web3 = require('web3');
const props = require('../../config/config');
const path = require('path');
const fs = require('fs');

const web3 = new Web3(props.web3URL);
const contractAddress = '0xa1782FDBE6906fdb198FbA0E21C6cC92D17C85f7';
const abiPath = '/Users/aardvocate/src/SmartContractCreator/contracts/assets/output/_AssetManager_sol_AssetManager.abi';
const abi = JSON.parse(fs.readFileSync(path.resolve(abiPath), 'utf8'));
const AssetManagerContract = new web3.eth.Contract(abi, contractAddress);

function importAddress() {
    // main mac - default
    web3.eth.personal.importRawKey(props.privKey, 'Wq017kmg@tm');
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
function postOrder(orderType, amount, price, assetId) {
    let value = 0;
    if (orderType === 'BUY') {
        // we must send ether to the smart contract worth how much we are willing to pay
        value = web3.utils.toWei((amount * price), 'ether');
    }

    const orderRequest = {
        orderType: orderType === 'BUY' ? 0 : 1,
        amount: amount,
        price: price,
        strategyType: 0,
        assetId: assetId
    }

    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address, value: value }).on('transactionHash', (hash) => {
            console.log(hash);
        });
    });
}

function postOrderWithAddress(address, password, orderType, amount, price, assetId) {
    const orderRequest = {
        orderType: orderType == 'BUY' ? 0 : 1,
        amount: amount,
        price: price,
        assetId: assetId
    }

    web3.eth.personal.unlockAccount(address, password).then(() => {
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address }).on('transactionHash', (hash) => {
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
                        seller: res.seller,
                        buyer: res.buyer,
                        assetId: res.assetId,
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

//processEvents();
//importAddress();
//createAssets();
// transferAsset(props.user1.address, 200000000, 3);
//transferAsset(props.user2.address, 150, "GUIL");
getAssets((allAssets) => { console.log(allAssets); });
//getIssuedAssets('0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', (allAssets) => {console.log(allAssets)});
//getUserAssets(props.user2.address, (allAssets) => {console.log(allAssets)});
// getUserAssets('0x2D00F0bB90859015E000477053AB1E44a53cB40B', (allAssets) => {console.log(allAssets)});
// price should be in wei
// postOrder('SELL', 1500, 1, 3, (hash) => console.log(hash));
// postOrder('SELL', 2000, 10, 2, (hash) => console.log(hash));
// postOrderWithAddress(props.user1.address, props.user1.password, 'BUY', 2000, 15, 3, (hash) => console.log(hash));
 //postOrderWithAddress(props.user1.address, props.user1.password, 'BUY', 20000, 15, 4, (hash) => console.log(hash));
//getOrders((allOrders) => { console.log(allOrders) });
 