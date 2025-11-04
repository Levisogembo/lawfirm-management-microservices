import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity({name:'roles'})
export class Roles {
    @PrimaryGeneratedColumn('uuid')
    id :string

    @Column({unique:true,nullable:false})
    role :string

    @OneToMany(()=>User,(user)=> user.role, {
        cascade: false // Don't cascade operations to users
    })
    user : User[]
}