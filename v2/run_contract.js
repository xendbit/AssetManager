const Web3 = require('web3');
const getRevertReason = require('eth-revert-reason')
const props = require('../config/config');
const path = require('path');
const fs = require('fs');
const Utils = require('web3-utils');
const web3 = new Web3(props.web3URL);
const contractAddress = props.v2.contractAddress;
const abiPath = props.v2.abiPath;
const abi = JSON.parse(fs.readFileSync(path.resolve(abiPath), 'utf8'));
const AssetManagerContract = new web3.eth.Contract(abi.abi, contractAddress);

// const erc20ContractAddress = props.v2.erc20ContractAddress;
// const ercAbiPath = props.v2.erc20AbiPath;
// const erc20Abi = JSON.parse(fs.readFileSync(path.resolve(ercAbiPath), 'utf8'));
// const ERC20Contract = new web3.eth.Contract(erc20Abi.abi, erc20ContractAddress);

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
                    console.error(e);
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
        price: price,
        issuer: props.address
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
    console.log("Account Unlocked");
    await AssetManagerContract.methods.mint(assetRequest).send({ from: props.contractor });
    console.log('Asset Minted');
    await AssetManagerContract.methods.transferShares(tokenId, props.address, totalQuantity).send({ from: props.contractor });
    console.log('Token Shares Transafered');
}

async function tokenShares(tokenId) {
    const ts = await AssetManagerContract.methods.tokenShares(tokenId).call();
    console.log(`Token Shares`);
    console.log(ts);
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
    let sca = await AssetManagerContract.methods.tokenShares(tokenId).call();
    console.log(sca);
}

async function transferToken(tokenId, recipient) {
    await AssetManagerContract.methods.transferTokenOwnership(tokenId, recipient).send({from: props.contractor});
}

async function postOrder(tokenId, orderType, orderStrategy, amount, price, goodUntil) {
    let value = 0;
    if (orderType === 0) {
        // we must send ether to the smart contract worth how much we are willing to pay
        value = amount * price;
    }

    const key = Utils.soliditySha3(
        { type: 'uint256', value: amount },
        { type: 'uint256', value: price },
        { type: 'uint256', value: tokenId },
        { type: 'uint256', value: new Date().getTime() }
    );

    console.log('KEY: ', key);

    orderRequest = {
        orderType: orderType,
        orderStrategy: orderStrategy,
        amount: amount,
        price: price,
        tokenId: tokenId,
        goodUntil: goodUntil,
        key: key
    };

    console.log(orderRequest);

    await web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm');
    await AssetManagerContract.methods.postOrder(orderRequest).send({ from: props.address, value: value });
    return key;
}

async function getOrder(key) {
    let order = await AssetManagerContract.methods.getOrder(key).call({from: props.address});
    console.log(order);
}

//erc20Methods();
processEvents();
//showMethods();
async function run() {    
    // const tokenId = Math.floor(Math.random() * 100000000);
    // console.log(tokenId);
    // await mint(tokenId, 'Test Asset', 'TAX', 1000000, 10);    
    // await tokenShares(tokenId);
    // await walletBalance(props.contractor);
    // await ownedShares(tokenId, props.contractor);
    // await ownedShares(tokenId, props.contractAddress);
    //let key = await postOrder(tokenId, OrderType.BUY, OrderStrategy.GTC, 1700, 1, 0);        
    //await getOrder(key);
    //await sharesContractDetails(tokenId);
    // await ownedShares(tokenId, props.address);
    // await walletBalance(props.address);
    // await transferToken(tokenId, props.address);
    // await sharesContractDetails(tokenId);
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