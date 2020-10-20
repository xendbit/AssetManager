const Web3 = require('web3');
const props = require('../config/config');
const path = require('path');
const fs = require('fs');
const { assert, expect } = require('chai');

const web3 = new Web3(props.web3URL);
const contractAddress = "0x7251d288c031F20336f7dA89e67a5d9Fe64F879B";
const abiPath = '/Users/aardvocate/src/SmartContractCreator/build/contracts/ArrayMappingTest.json';
const abi = JSON.parse(fs.readFileSync(path.resolve(abiPath), 'utf8'));
const ArrayMappingContract = new web3.eth.Contract(abi.abi, contractAddress);
const TIMEOUT = 60000;


describe.skip('ArrayMappingContract Tests', () => {
    before((done) => {
        web3.eth.personal.unlockAccount(props.address, 'Wq017kmg@tm').then(() => {
            console.log('unlocked account');
            done();
        });
    })

    after((done) => {
        ArrayMappingContract.methods.clear('Segun').send({ from: props.address }).then(() => {
            console.log("cleared segun");            
        });

        ArrayMappingContract.methods.clear('Deji').send({ from: props.address }).then(() => {
            console.log("cleared deji");            
        });

        done();        
    })

    it('should add a new element in the array with key', (done) => {
        ArrayMappingContract.methods.add('Segun', 3).send({ from: props.address }).then(() => {
            console.log("3 added to segun");
            done();
        });
    }).timeout(TIMEOUT);

    it('should add a another element in the array with same key', (done) => {
        ArrayMappingContract.methods.add('Segun', 4).send({ from: props.address }).then(() => {
            console.log("4 added to segun");
            done();
        });
    }).timeout(TIMEOUT);

    it('should add a third element in the array with same key and same value', (done) => {
        ArrayMappingContract.methods.add('Segun', 5).send({ from: props.address }).then(() => {
            console.log("5 added to segun");
            done();
        });
    }).timeout(TIMEOUT);

    it('should add a new element in the array with new key', (done) => {
        ArrayMappingContract.methods.add('Deji', 10).send({ from: props.address }).then(() => {
            console.log("10 added to deji");
            done();
        });
    }).timeout(TIMEOUT);

    it('should add a secong element in the array for new key', (done) => {
        ArrayMappingContract.methods.add('Deji', 33).send({ from: props.address }).then(() => {
            console.log("33 added to deji");
            done();
        });
    }).timeout(TIMEOUT);

    it('should add a third element in the array for new key', (done) => {
        ArrayMappingContract.methods.add('Deji', 55).send({ from: props.address }).then(() => {
            console.log("55 added to deji");
            done();
        });
    }).timeout(TIMEOUT);    

    it('should get a list of added elements for first key', (done) => {
        ArrayMappingContract.methods.get('Segun').call({ from: props.address }).then(result => {
            console.log(result);
            expect(result).to.be.an("array");
            assert.isTrue(+result[0] === 3, "first element is 3");
            assert.isTrue(+result[result.length - 1] === 5, "last element is 5");
            assert.isTrue(result.length === 3, "length of array should be 3");
            done();
        });
    }).timeout(TIMEOUT);

    it('should get a list of added elements for second key', (done) => {
        ArrayMappingContract.methods.get('Deji').call({ from: props.address }).then(result => {
            console.log(result);
            expect(result).to.be.an("array");
            assert.isTrue(+result[0] === 10, "first element is 10");
            assert.isTrue(+result[result.length - 1] === 55, "last element is 55");
            assert.isTrue(result.length === 3, "length of array should be 2");
            done();
        });
    }).timeout(TIMEOUT);    

    it('should deletes an element at index from first array', (done) => {
        ArrayMappingContract.methods.remove('Segun', 1).send({ from: props.address }).then(() => {
            console.log("delete 4 from segun");
            done();
        });
    }).timeout(TIMEOUT);  
    
    it('should get a list of added elements for first key', (done) => {
        ArrayMappingContract.methods.get('Segun').call({ from: props.address }).then(result => {
            console.log(result);
            expect(result).to.be.an("array");
            assert.isTrue(+result[0] === 3, "first element is 3");
            assert.isTrue(+result[result.length - 1] === 5, "last element is 5");
            assert.isTrue(result.length === 2, "length of array should be 2");
            done();
        });
    }).timeout(TIMEOUT);

    it('should deletes an element at index from first array', (done) => {
        ArrayMappingContract.methods.remove('Segun', 0).send({ from: props.address }).then(() => {
            console.log("delete 4 from segun");
            done();
        });
    }).timeout(TIMEOUT);  
    
    it('should get a list of added elements for first key', (done) => {
        ArrayMappingContract.methods.get('Segun').call({ from: props.address }).then(result => {
            console.log(result);
            expect(result).to.be.an("array");
            assert.isTrue(+result[0] === 5, "first element is 3");
            assert.isTrue(+result[result.length - 1] === 5, "last element is 5");
            assert.isTrue(result.length === 1, "length of array should be 1");
            done();
        });
    }).timeout(TIMEOUT);
    
    it('should deletes an element at index from second array', (done) => {
        ArrayMappingContract.methods.remove('Deji', 2).send({ from: props.address }).then(() => {
            console.log("delete 55 from deji");
            done();
        });
    }).timeout(TIMEOUT);  

    it('should get a list of added elements for second key', (done) => {
        ArrayMappingContract.methods.get('Deji').call({ from: props.address }).then(result => {
            console.log(result);
            expect(result).to.be.an("array");
            assert.isTrue(+result[0] === 10, "first element is 10");
            assert.isTrue(+result[result.length - 1] === 33, "last element is 10");
            assert.isTrue(result.length === 2, "length of array should be 1");
            done();
        });
    }).timeout(TIMEOUT);    

});