const path = require('path');
const fs = require('fs');
const Web3 = require('web3');
const props = require('./config/config');


async function deploy(abiPath, binPath) {    
    const abi = JSON.parse(fs.readFileSync(path.resolve(abiPath), 'utf8'));
    const bin = fs.readFileSync(path.resolve(binPath), 'utf8');
    const web3 = new Web3(props.web3URL);
    const privKey = props.privKey;
    const address = props.address;    

    const contract = new web3.eth.Contract(abi);

    console.log("Attempting to deploy contract");
    const contractTx = contract.deploy({
        data: bin,
        arguments: [],
    });
    console.log("Contract deployed");

    console.log("Attempting to create transaction");
    const createTransaction = await web3.eth.accounts.signTransaction(
        {
            from: address,
            data: contractTx.encodeABI(),
            gas: props.gas,
        },
        privKey
    );
    console.log("Transaction created");

    console.log('Deploying contract....')
    web3.eth.sendSignedTransaction(createTransaction.rawTransaction).on('receipt', console.log);

    //console.log('Contract deployed at address', createReceipt.contractAddress);
    return  'Creating Contract';    
}

async function run() {
    res = await deploy('/Users/aardvocate/src/SmartContractCreator/contracts/assets/output/_AssetManager_sol_AssetManager.abi', '/Users/aardvocate/src/SmartContractCreator/contracts/assets/output/_AssetManager_sol_AssetManager.bin');
    console.log("AssetManager: --> ", res);
    //res = await deploy('/Users/aardvocate/src/SmartContractCreator/contracts/assets/output/__contracts_NGNC_sol_NGNC.abi', '/Users/aardvocate/src/SmartContractCreator/contracts/assets/output/__contracts_NGNC_sol_NGNC.bin');
    //console.log("NGNC: --> ", res);
}

run();