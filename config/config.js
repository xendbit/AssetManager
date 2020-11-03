const properties = {
    web3URL: 'http://127.0.0.1:8545',//'http://209.250.234.75:8545',
    address: '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc', // any unlocked address on the server
    contractor: '0xB6D80F6d661927afEf42f39e52d630E250696bc4', // contract deployer
    contractAddress: '0x85fee11ec6e6e0D7fE4FFeC1f2bEaC6973460fCc', // address of contract after deploy
    abiPath: 'build/contracts/AssetManager.json',
    gas: '4004356',
    // another unlocked account on the server
    user1: {
        password: "Wq017kmg@tm",
        address: "0xC04915f6b3ff85b50A863eB1FcBF368171539413",
    },
    // another unlocked account on the server
    user2: {
        password: "Wq017kmg@tm",
        address: "0xf0eB683bb243eCE4Fe94494E4014628AfCb6Efe5",
    },  
}

module.exports = properties;