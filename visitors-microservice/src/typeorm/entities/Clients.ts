import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Cases } from "./Cases";
import { Appointments } from "./Appointments";
import { Files } from "./Files";

@Entity({name:'client'})
export class Clients {
    @PrimaryGeneratedColumn('uuid')
    clientId: string

    @Column()
    clientName: string

    @Column()
    phoneNumber: string

    @Column({unique:true})
    email: string

    @Column()
    createdAt: Date

    @OneToMany(()=>Cases,(caseItem)=>caseItem.client)
    cases: Cases[]

    //linking clients and appointments
    @OneToMany(()=>Appointments,(appointment)=>appointment.client)
    appointments?: Appointments[]

    //linking clients to their files
    @OneToMany(()=>Files,(file)=>file.Client)
    files: Files[]
}