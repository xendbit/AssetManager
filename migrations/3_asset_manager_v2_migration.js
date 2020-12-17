const AssetModelV2 = artifacts.require("AssetModelV2");
const OrderModelV2 = artifacts.require("OrderModelV2");
const AssetManagerV2 = artifacts.require("AssetManagerV2");
const Constants = artifacts.require("Constants");

const Web3 = require('web3');
const props = require('../config/config');
const web3 = new Web3(props.web3URL);

web3.eth.personal.unlockAccount(props.contractor, props.password).then(() => {
  console.log(`unlocked ${props.contractor}`)
});

module.exports = function (deployer) {
  deployer.deploy(AssetModelV2, { overwrite: false });
  deployer.deploy(OrderModelV2, { overwrite: false });
  deployer.deploy(Constants, { overwrite: false });

  deployer.link(Constants, AssetManagerV2);
  deployer.link(AssetModelV2, AssetManagerV2);
  deployer.link(OrderModelV2, AssetManagerV2);
  deployer.deploy(AssetManagerV2);  
};
