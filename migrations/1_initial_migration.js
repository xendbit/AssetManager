const Migrations = artifacts.require("Migrations");
const Web3 = require('web3');
const props = require('../config/config');
const web3 = new Web3(props.web3URL);

module.exports = function (deployer) {
  deployer.deploy(Migrations, {overwrite: false});
};
