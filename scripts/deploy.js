// scripts/deploy.js
async function deploy_constants_lib() {
    const ConstantsV2 = await ethers.getContractFactory("ConstantsV2")
    console.log("Deploying Constants...");
    const cl = await ConstantsV2.deploy();
    await cl.deployed();
    console.log(`Constants Lib Deployed @ ${cl.address}`);
    return cl.address;
}

async function main() {
    const cl = await deploy_constants_lib();
    // We get the contract to deploy
    const AM2 = await ethers.getContractFactory("AssetManagerV2", {
        libraries: {
            ConstantsV2: cl
        }
    });
    console.log("Deploying AssetManagerV2...");
    const am2 = await AM2.deploy();
    await am2.deployed();
    console.log("AssetManagerV2 deployed to:", am2.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });