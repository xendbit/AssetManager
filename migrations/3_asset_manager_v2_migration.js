const OrderModelV2 = artifacts.require("OrderModelV2");
const AssetManagerV2 = artifacts.require("AssetManagerV2");
const ConstantsV2 = artifacts.require("ConstantsV2");

module.exports = function (deployer) {
  deployer.deploy(OrderModelV2, { overwrite: false });
  deployer.deploy(ConstantsV2, { overwrite: false });

  deployer.link(ConstantsV2, AssetManagerV2);
  deployer.link(OrderModelV2, AssetManagerV2);
  deployer.deploy(AssetManagerV2);  
};
