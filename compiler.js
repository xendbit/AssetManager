const path = require('path');
const fs = require('fs');
const solc = require('solc');
const Web3 = require('web3');
const props = require('./config/config');

function compile(solFilePath) {
    const contractPath = path.resolve(solFilePath);
    const fileName = path.basename(solFilePath);
    const source = fs.readFileSync(contractPath, 'utf8');
    const input = {
        language: 'Solidity',
        sources: {
            'Contract.sol': {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*'],
                },
            },
        },
    };
    const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
    if (tempFile.errors) {
        const error = tempFile.errors[0];
        const errorCode = error['code'];
        const errorFormattedMessage = error['formattedMessage'];
        const errorMessage = error['message'];
        errorObject = {
            code: errorCode,
            fullMessage: errorFormattedMessage,
            message: errorMessage
        };

        console.log(errorObject);
        return JSON.stringify(errorObject);
    }
    const key = fileName.replace(".sol", "");
    const contractFile = tempFile.contracts['Contract.sol'][key];
    return contractFile;
}

async function deploy(contractFile) {
    // Initialization
    const bytecode = contractFile.evm.bytecode.object;
    const abi = contractFile.abi;
    const privKey = props.privKey;
    const address = props.address;
    const web3 = new Web3(props.web3URL);


    // Deploy contract
    console.log('Attempting to deploy from account:', address);

    const contract = new web3.eth.Contract(abi);

    const contractTx = contract.deploy({
        data: bytecode,
        arguments: [],
    });

    const createTransaction = await web3.eth.accounts.signTransaction(
        {
            from: address,
            data: contractTx.encodeABI(),
            gas: props.gas,
        },
        privKey
    );

    const createReceipt = await web3.eth.sendSignedTransaction(
        createTransaction.rawTransaction
    );

    console.log('Contract deployed at address', createReceipt.contractAddress);
    return  createReceipt.contractAddress;
}

// Compile contract

const compiler = {
    compile: compile,
    deploy: deploy,
}


module.exports = compiler;