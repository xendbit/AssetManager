const OrderModelV2 = artifacts.require("OrderModelV2");
const AssetManagerV2 = artifacts.require("AssetManagerV2");
const ConstantsV2 = artifacts.require("ConstantsV2");

const Web3 = require('web3');
const props = require('../config/config');
const web3 = new Web3(props.web3URL);

module.exports = function (deployer) {
  deployer.deploy(OrderModelV2, { overwrite: false });
  deployer.deploy(ConstantsV2, { overwrite: false });

  deployer.link(ConstantsV2, AssetManagerV2);
  deployer.link(OrderModelV2, AssetManagerV2);
  deployer.deploy(AssetManagerV2);  
};
