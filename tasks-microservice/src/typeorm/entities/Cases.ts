import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Clients } from "./Clients";
import { User } from "./User";
import { Files } from "./Files";
import { Appointments } from "./Appointments";
import { caseStatus } from "./enums/case.enums";


@Entity({name:'cases'})
export class Cases {
    @PrimaryGeneratedColumn('uuid')
    caseID : string

    @Column()
    caseTitle: string

    @Column({unique:true})
    caseNumber: string

    @Column()
    caseType: string

    @Column()
    caseStatus : caseStatus

    @Column()
    filedDate: Date

    @Column({nullable:true})
    hearingDate: Date

    @Column()
    assignedJudge: string

    @Column({nullable:true})
    plaintiffs: string

    @Column({nullable:true})
    defendants: string

    @Column('simple-json',{nullable:true})
    caseNotes : { message: string }[];
    
    //relating a case to its client
    @ManyToOne(()=>Clients,(client)=>client.cases)
    @JoinColumn({name:'clientId'})
    client: Clients

    //relating a case to the assigned lawyer
    @ManyToOne(()=>User,(user)=>user.Cases)
    @JoinColumn({name:'assignedTo'})
    assignedTo: User

    @Column()
    assignedBy?: string

    //relating a case to a file
    @OneToMany(()=>Files,(file)=>file.Case)
    @JoinColumn({name:'fileId'})
    files?: Files[]

    //relating a case to an appointment
    @OneToMany(()=>Appointments,(appointment)=>appointment.case)
    appointment?: Appointments[]
}