export class Config {
    public static readonly web3URL = 'http://127.0.0.1:8545';
    public static readonly dtslAddress = '0x94Ce615ca10EFb74cED680298CD7bdB0479940bc';
    public static readonly contractor = '0xB6D80F6d661927afEf42f39e52d630E250696bc4';
    public static readonly contractAddress = '0x85fee11ec6e6e0D7fE4FFeC1f2bEaC6973460fCc';
    public static readonly abiPath = '/etc/assetmanager/AssetManager.json';
    public static readonly gas = '4004356';     

    public static generatePassword(passwordLength) {
        const numberChars = "0123456789";
        const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowerChars = "abcdefghijklmnopqrstuvwxyz";
        const allChars = numberChars + upperChars + lowerChars;
        let randPasswordArray = Array(passwordLength);
        randPasswordArray[0] = numberChars;
        randPasswordArray[1] = upperChars;
        randPasswordArray[2] = lowerChars;
        randPasswordArray = randPasswordArray.fill(allChars, 3);
        return Config.shuffleArray(randPasswordArray.map(function (x) { return x[Math.floor(Math.random() * x.length)] })).join('');
    }

    public static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }    
}
