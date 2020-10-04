const Web3 = require('web3');
const props = require('../../config/config');
const path = require('path');
const fs = require('fs');
const { request } = require('http');

const web3 = new Web3(props.web3URL);
const contractAddress = '0x26532cf4Ca463f0a8179Edc7051e2BBC94194eCB';
const abiPath = '/Users/aardvocate/src/SmartContractCreator/contracts/assets/output/_classes_AssetManager_sol_AssetManager.abi';
const abi = JSON.parse(fs.readFileSync(path.resolve(abiPath), 'utf8'));
const AssetManagerContract = new web3.eth.Contract(abi, contractAddress);

function processEvents() {
    // to process all past events 
    AssetManagerContract.getPastEvents('allEvents', {
        fromBlock: 0,
        toBlock: 'latest'
    }).then(function (events) {
        for(e of events) {
            //console.error(e);
            let name = e.event;
            console.log(name);

            if(name === 'OrderPosted') {
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

function getAssets() {
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getAssets().call({ from: props.address }).then(console.log);
    });
}

function getIssuedAssets(address) {
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getIssuedAssets(address).call({ from: props.address }).then(console.log);
    });
}

function getUserAssets(address) {
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getUserAssets(address).call({ from: props.address }).then(console.log);
    });
}

function postOrder() {
    const orderRequest = {
        orderType: 0,
        amount: 40,
        price: 40,
        assetId: 3
    }

    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address }).on('transactionHash', (hash) => {
            console.log(hash);
        });
    });    
}

function getOrders() {
    web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
        AssetManagerContract.methods.getOrders().call({ from: props.address }).then(console.log);
    });    
}

processEvents();
//createNewAsset('STAR', 'Star');
//getAssets();
//getIssuedAssets('0x94Ce615ca10EFb74cED680298CD7bdB0479940bc');
//getUserAssets('0x94Ce615ca10EFb74cED680298CD7bdB0479940bc');
//postOrder();
getOrders();