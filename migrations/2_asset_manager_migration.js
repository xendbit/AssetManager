const props = require('../config/config');
const AssetManager = artifacts.require("AssetManager");
const OrderModel = artifacts.require("OrderModel");

module.exports = function (deployer) {
  deployer.deploy(OrderModel, {overwrite: false});
  deployer.link(OrderModel, AssetManager);
  deployer.deploy(AssetManager, {gas: props.gas});
};
