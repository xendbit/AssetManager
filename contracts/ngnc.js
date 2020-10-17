const Web3 = require('web3');
const props = require('../config/config');
const path = require('path');
const fs = require('fs');

const web3 = new Web3(props.web3URL);
const contractAddress = props.ngnc.contractAddress;
const abiPath = props.ngnc.abiPath;
const abi = JSON.parse(fs.readFileSync(path.resolve(abiPath), 'utf8'));
const NGNCContract = new web3.eth.Contract(abi, contractAddress);

function send(amount, recipient, callback) {
    //web3.eth.personal.importRawKey("c5fd8168f094e64e585be23c240b01ed6da7dbe783cf47421f8472214bf701b0", 'Wq017kmg@tm')
    web3.eth.personal.unlockAccount(props.ngnc.address, props.ngnc.password).then(() => {
        NGNCContract.methods.transfer(recipient, amount).send({ from: props.address }).on('transactionHash', (hash) => {
            callback(hash)
        });
    });    
}

send(10000000, "0x94Ce615ca10EFb74cED680298CD7bdB0479940bc", (hash) => {console.log(hash)});
