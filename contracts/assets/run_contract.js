const Web3 = require('web3');
const props = require('../../config/config');
const path = require('path');
const fs = require('fs');

const web3 = new Web3(props.web3URL);
const contractAddress = '0x2D00F0bB90859015E000477053AB1E44a53cB40B';
const abiPath = '/Users/aardvocate/src/SmartContractCreator/contracts/assets/output/_classes_AssetManager_sol_AssetManager.abi';
const abi = JSON.parse(fs.readFileSync(path.resolve(abiPath), 'utf8'));
const AssetManagerContract = new web3.eth.Contract(abi, contractAddress);

function processEvents() {
    // to process all past events 
    AssetManagerContract.getPastEvents('allEvents', {
        fromBlock: 0,
        toBlock: 'latest'
    }).then(function (events) {
        for (e of events) {
            //console.error(e);
            let name = e.event;
            console.log(name);

            if (name === 'OrderPosted') {
                console.log(e.returnValues.order);
            }
        }
    });
}

function createNewAsset(name, desc) {
    const assetRequest = {
        name: name,
        description: desc,
        totalQuantity: 1000000,
        decimal: 2
    }

    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.createAsset(assetRequest).send({ from: props.address }).on('transactionHash', (hash) => {
            console.log(hash);
        });
    });
}

function getAssets(callback) {
    let allAssets = [];
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getAssets().call({ from: props.address }).then(result => {
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

function postOrder(orderType, amount, price, assetId, callback) {
    const orderRequest = {
        orderType: orderType == 'BUY' ? 0 : 1,
        amount: amount,
        price: price,
        assetId: assetId
    }

    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address }).on('transactionHash', (hash) => {
            callback(hash);
        });
    });
}

function getOrders(callback) {
    let allOrders = [];
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getOrders().call({ from: props.address, gas: props.gas, }).then((result) => {
            for (res of result) {
                if (res.id > 0) {
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


//createNewAsset('BUD', 'Budweiser');
//getAssets((allAssets) => { console.log(allAssets); });
//getIssuedAssets('0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', (allAssets) => {console.log(allAssets)});
//getUserAssets('0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', (allAssets) => {console.log(allAssets)});
//getUserAssets('0x2D00F0bB90859015E000477053AB1E44a53cB40B', (allAssets) => {console.log(allAssets)});
postOrder('BUY', 20, 10, 3, (hash) => console.log(hash));
getOrders((allOrders) => { console.log(allOrders) });

//processEvents();