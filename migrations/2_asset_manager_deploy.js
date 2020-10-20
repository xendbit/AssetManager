const props = require('../config/config');
const AssetManager = artifacts.require("AssetManager");
const Math = artifacts.require("Math");
const OrderModel = artifacts.require("OrderModel");
const AssetModel = artifacts.require("AssetModel");

module.exports = function (deployer) {
  deployer.deploy(Math, {overwrite: false});
  deployer.deploy(OrderModel, {overwrite: false});
  deployer.deploy(AssetModel, {overwrite: false});  
  deployer.link(Math, AssetManager);
  deployer.link(OrderModel, AssetManager);
  deployer.link(AssetModel, AssetManager);
  //deployer.deploy(AssetManager, {gas: props.gas});
  deployer.deploy(AssetManager);
};
