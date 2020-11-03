const Migrations = artifacts.require("Migrations");
const Web3 = require('web3');
const props = require('../config/config');
const web3 = new Web3(props.web3URL);

web3.eth.personal.unlockAccount(props.contractor, props.password).then(() => {
  console.log(`unlocked ${props.contractor}`)
});

module.exports = function (deployer) {
  deployer.deploy(Migrations, {overwrite: false});
};
