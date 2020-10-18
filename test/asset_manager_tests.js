const AssetManager = artifacts.require("AssetManager");
const props = require('../config/config');

contract('AssetManager', accounts => {

    // beforeEach(async () => {
    //     console.log("Before Each");
    // });

    // afterEach(async () => {
    //     console.log("After Each");
    // });

    it('should create new asset', async function (done) {
        let assetRequest = {
            name: 'BUD',
            description: 'Budweiser',
            totalQuantity: 100000000,
            decimal: 2
        };
        console.log("Deploying Asset Manager");
        AssetManager.deployed().then(assetManager => {
            console.log("Creating new asset");
            assetManager.createAsset.call(assetRequest).then((result) => {
                console.log("Getting Assets: ", result);
                assetManager.getAssets.call().then((assets) => {
                    console.log(assets);
                    assert.typeOf(assets, 'array', 'assets should be an array');
                    assert.lengthOf(assets, 1, 'assets should contain one element');
                    assert.equal(assets[0].name, 'BUD', 'name of asset should be BUD');
                    assert.equal(assets[0].decimal, 2, 'decimal should be 2');

                    done();
                });
            });
        });
        // wrap what you want to debug with `debug()`:
        //await debug(myContract.myFunction(accounts[1], { from: accounts[0] }));
    });

    it('should transfer asset', async function (done) {        
        console.log("Deploying Asset Manager");
        AssetManager.deployed().then(async assetManager => {
            console.log("Transfering Asset");
            assetManager.transferAsset.call(props.user2.address, "BUD", 3150).then(() => {
                console.log("Getting Assets");
                assetManager.getAssets.call().then(assets => {
                    console.log(assets);
                    assert.typeOf(assets, 'array', 'assets should be an array');
                    assert.lengthOf(assets, 2, 'assets should contain one element');
                    assert.equal(assets[0].name, 'BUD', 'object 1 name of asset should be BUD');
                    assert.equal(assets[0].decimal, 2, 'object 1 decimal should be 2');
                    assert.equal(assets[0].quantity, (100000000 - 3150), 'object 1 quantity should be less by 3150');
                    assert.equal(assets[1].name, 'BUD', 'object 2 name of asset should be BUD');
                    assert.equal(assets[1].decimal, 2, 'object 2 decimal should be 2');
                    assert.equal(assets[1].quantity, 3150, 'object 2 quantity should be 3150');

                    done();
                });
            });        
        });
    });
})
