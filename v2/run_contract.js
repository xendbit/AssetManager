const Web3 = require('web3');
const props = require('../config/config');
const path = require('path');
const fs = require('fs');
const Utils = require('web3-utils');
const web3 = new Web3(props.web3URL);
const contractAddress = props.v2.contractAddress;
const abiPath = props.v2.abiPath;
const abi = JSON.parse(fs.readFileSync(path.resolve(abiPath), 'utf8'));
const AssetManagerContract = new web3.eth.Contract(abi.abi, contractAddress);

const erc20ContractAddress = props.v2.erc20ContractAddress;
const ercAbiPath = props.v2.erc20AbiPath;
const erc20Abi = JSON.parse(fs.readFileSync(path.resolve(ercAbiPath), 'utf8'));
const ERC20Contract = new web3.eth.Contract(erc20Abi.abi, erc20ContractAddress);

async function erc20Methods() {
    console.log(ERC20Contract.methods);
    console.log(await ERC20Contract.methods.totalSupply().call({ from: props.address }));
    console.log(await ERC20Contract.methods.balanceOf(props.address).call({ from: props.address }));
}

function showMethods() {
    console.log(AssetManagerContract.methods);
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

async function mint(tokenId, name, symbol, totalQuantity, price) {
    const assetRequest = {
        tokenId: tokenId,
        name: name,        
        symbol: symbol,
        totalQuantity: totalQuantity,
        price: price
    }


    // const ar = {
    //     name: 'Test Asset',
    //     tokenId: Math.floor(Math.random() * 100000000),
    //     symbol: 'TAX',
    //     totalQuantity: 1000000,
    //     price: 10
    // };    

    console.log(assetRequest);

    await web3.eth.personal.unlockAccount(props.contractor, 'Wq017kmg@tm');
    await AssetManagerContract.methods.mint(assetRequest).send({ from: props.contractor });
    console.log('Asset Minted');
}

async function ownedShares(tokenId, userAddress) {
    //await web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm');
    const balance = await AssetManagerContract.methods.ownedShares(tokenId, userAddress).call({ from: props.address });
    console.log(`tokenId: ${tokenId}, user: ${userAddress}, shares: ${balance}`);
}

async function walletBalance(userAddress) {
    //await web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm');
    const balance = await AssetManagerContract.methods.walletBalance(userAddress).call({ from: props.address });
    console.log(`user: ${userAddress}, wallet balance: ${balance}`);
}

async function fundWallet(userAddress, amount) {
    await web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm');
    await AssetManagerContract.methods.fundWallet(userAddress, amount).send({ from: props.address });
}

async function transferShares(tokenId, userAddress, amount) {
    await web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm');
    await AssetManagerContract.methods.transferShares(tokenId, userAddress, amount).send({ from: props.address });
}

async function buyShares(tokenId, seller, amount, price) {
    await web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm');
    await AssetManagerContract.methods.buyShares(tokenId, seller, amount, price).send({ from: props.address });
}

async function sharesContractDetails(tokenId) {
    let sca = await AssetManagerContract.methods.sharesContract(tokenId).call();
    console.log(sca);
    console.log(sca[0]);
    console.log(sca['0']);
}

//erc20Methods();
//processEvents();
//showMethods();
async function run() {
    const tokenId = Math.floor(Math.random() * 100000000);
    await mint(tokenId, 'Test Asset', 'TAX', 1000000, 10);
    await sharesContractDetails(tokenId);
    await ownedShares(tokenId, props.address);
    await walletBalance(props.address);
    // await fundWallet(props.user2.address, 125400);
    // await transferShares(tokenId, props.user2.address, 25700);
    // await ownedShares(tokenId, props.user2.address);
    // await walletBalance(props.user2.address);    
    // await ownedShares(tokenId, props.address);
    // await walletBalance(props.address);    
    // await buyShares(tokenId, props.user2.address, 500, 10);
    // await ownedShares(tokenId, props.user2.address);
    // await walletBalance(props.user2.address);    
    // await ownedShares(tokenId, props.address);
    // await walletBalance(props.address);    
}

run();