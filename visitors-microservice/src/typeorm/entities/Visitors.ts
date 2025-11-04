import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Visitors {
    @PrimaryGeneratedColumn('uuid')
    visitorId

    @Column()
    fullName: string

    @Column()
    phoneNumber: string

    @Column()
    purposeOfVisit: string

    @Column({nullable:true})
    whoToSee: string

    @Column({type:'datetime',nullable:true})
    timeIn: Date
}