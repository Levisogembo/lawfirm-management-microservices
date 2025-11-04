import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Clients } from "./Clients";
import { Cases } from "./Cases";
import { User } from "./User";

@Entity({name:'appointments'})
export class Appointments {
    @PrimaryGeneratedColumn('uuid')
    appointmentId: string

    @Column()
    title: string

    @Column({type:'datetime'})
    startTime: Date

    @Column({type:'datetime'})
    endTime: Date

    @Column('simple-json',{nullable:true})
    notes: { message: string }[]

    @Column()
    location: string

    @Column({type:'datetime'})
    createdAt: Date

    //linking appointments to clients
    @ManyToOne(()=>Clients,(client)=>client.appointments)
    @JoinColumn({name:'clientId'})
    client?: Clients

    //linking appointment to a case
    @ManyToOne(()=>Cases,(cases)=>cases.appointment)
    @JoinColumn({name:'caseId'})
    case?: Cases

    //linking an appointment to the assigned lawyer
    @ManyToOne(()=>User,(user)=>user.appointments)
    @JoinColumn({name:'assignedTo'})
    assignedTo: User

}