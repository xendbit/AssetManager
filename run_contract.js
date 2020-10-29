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

function importAddress() {
    // main mac - default
    //web3.eth.personal.importRawKey(props.privKey, 'Wq017kmg@tm');
    web3.eth.personal.importRawKey(props.user2.privKey, 'Wq017kmg@tm');
    web3.eth.personal.importRawKey(props.user1.privKey, 'Wq017kmg@tm');
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
            }
        });
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

function getBalances() {
    let allOrders = [];
    web3.eth.personal.unlockAccount(props.user1.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getTokenBalance().call({ from: props.user1.address, gas: props.gas, }).then((result) => {
            console.log(`Token Balance: ${result}`);
            AssetManagerContract.methods.getEscrowBalance().call({ from: props.user1.address, gas: props.gas, }).then((result) => {
                console.log(`Escrow Balance: ${result}`);
            });
        });
    });
}

function testBS() {
    web3.eth.personal.unlockAccount(props.user1.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.testBinarySearch().send({ from: props.user1.address }).then(() => {
            //console.log(`POS: ${result}`);
        });
    });
}
async function start() {
    createNewAsset('BUD', 'Budweiser', (hash) => {
        console.log(hash);
        getAssets((allAssets) => {
            console.log(allAssets);
            transferAsset(props.user1.address, 13150, "BUD", (hash) => {
                console.log(hash);
                postOrder(0, 0, 1500, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {
                    console.log(hash);
                    postOrderWithAddress(props.user1.address, props.user1.password, 1, 0, 1500, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {
                        console.log(hash);
                        processEvents();
                    });
                });
            });
        });
    });
}

function binarySearch(arr, l, r, x) {
    console.log(387, arr, l, r);
    if (r >= l) {
        mid = Math.floor(l + (r - l) / 2);
        console.log(387, mid);
        // If the element is present at the middle 
        // itself 
        if (arr[mid] == x) {
            return mid;
        }

        // If element is smaller than mid, then 
        // it can only be present in left subarray 
        if (arr[mid] > x) {
            return binarySearch(arr, l, mid - 1, x);
        }

        // Else the element can only be present 
        // in right subarray 
        return binarySearch(arr, mid + 1, r, x);
    }

    // We reach here when element is not 
    // present in array 
    return -1;
}

//console.log(binarySearch([1,2,3,4,5], 0, 4, 5));


//testBS();
//start();
// processEvents();
//postOrder(0, 0, 1500, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {console.log(hash);});
//postOrderWithAddress(props.user1.address, props.user1.password, 1, 0, 1500, 1, 'BUD', '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', 0, (hash) => {console.log(hash);});
// getOrders("PENDING_ORDERS", (allOrders) => { console.log(allOrders); console.log(allOrders.length) });
//getOrders("BUY_ORDERS", (allOrders) => { console.log(allOrders) });
// getOrders("SELL_ORDERS", (allOrders) => { console.log(allOrders) });
getOrders("MATCHED_ORDERS", (allOrders) => { console.log(allOrders) });
//getOrders("DELETED_ORDERS", (allOrders) => { console.log(allOrders) });
//getUserOrders(props.user1.address, (allOrders) => {console.log(allOrders)});









    // function testBinarySearch() public {
    //     OrderModel.SortedKey[] memory keys = new OrderModel.SortedKey[](5);
    //     keys[0] = OrderModel.SortedKey({
    //         key: bytes32('key1'),
    //         date: block.timestamp + 1
    //     });
    //     keys[1] = OrderModel.SortedKey({
    //         key: bytes32('key2'),
    //         date: block.timestamp + 2
    //     });        
    //     keys[2] = OrderModel.SortedKey({
    //         key: bytes32('key3'),
    //         date: block.timestamp + 3
    //     });        
    //     keys[3] = OrderModel.SortedKey({
    //         key: bytes32('key4'),
    //         date: block.timestamp + 4
    //     });        
    //     keys[4] = OrderModel.SortedKey({
    //         key: bytes32('key5'),
    //         date: block.timestamp + 5
    //     });  

    //     int256 pos = Constants.binarySearch(keys, 0, 4, keys[2]);         

    //     emit DEBUG(keys.length);
    //     emit DEBUG(keys);
    //     emit DEBUG('----------------------------------');
    //     if (pos >= 0) {         
    //         uint256 p = uint256(pos);
    //         emit DEBUG(p);
    //         for(uint256 i = p; i < 4; i++) {
    //             keys[i] = keys[i+1];
    //         }
    //         delete keys[4];
    //     }
    //     emit DEBUG(keys.length);
    //     emit DEBUG(keys);
    // }
