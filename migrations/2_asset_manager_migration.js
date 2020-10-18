const props = require('../config/config');
const AssetManager = artifacts.require("AssetManager");

module.exports = function (deployer) {
  deployer.deploy(AssetManager, {gas: props.gas, from: props.address});
};
