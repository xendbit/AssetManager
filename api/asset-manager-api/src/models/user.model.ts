import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("user")
@Unique("user_idx", ["userId", "address"])
export class User {
    @PrimaryGeneratedColumn()
    id?: number;
    @Column()
    privateKey: string;
    @Column()
    password: string;    
    @Column()
    address: string;
    @Column()    
    userId: number;    
}