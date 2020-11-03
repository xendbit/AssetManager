import { User } from './../models/user.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { AES } from 'crypto-js';
import Web3 from 'web3';
import { Config } from './../models/config';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
    private web3;
    @InjectRepository(User)
    private userRepository: Repository<User>

    constructor() {
        this.web3 = new Web3(Config.web3URL);
    }

    async getNewAddress(userId: number) {
        let dbUser = await this.userRepository.query("SELECT * FROM user WHERE userId = ?", [userId]);
        if(dbUser.length === 1) {
            return dbUser[0];
        }

        const password = Config.generatePassword(32);
        const account = this.web3.eth.accounts.create(password);        
        const encrypted = AES.encrypt(password, 'tfyscanf').toString();  
        const pkEncrypted = AES.encrypt(account.privateKey, 'tfyscanf').toString();      
        // console.log(password);
        // console.log(AES.decrypt(encrypted, 'tfyscanf').toString(enc.Utf8));

        // import the address into the server.
        // console.log(account.privateKey.replace('0x', ''));        
        this.web3.eth.personal.importRawKey(account.privateKey.replace('0x', ''), password);
        
        const user: User = {
            password: encrypted,
            privateKey: pkEncrypted,
            address: account.address,
            userId: userId
        }
        
        dbUser = await this.userRepository.save(user);
        return dbUser;
    }
}
