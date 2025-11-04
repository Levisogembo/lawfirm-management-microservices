import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Roles } from "./Roles";
import { Tasks } from "./Tasks";
import { Cases } from "./Cases";
import { Appointments } from "./Appointments";

@Entity({name:'users'})
export class User{
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({unique:true,nullable:false})
    email:string

    @Column({unique:true,nullable:false})
    username:string

    @Column({nullable:false})
    fullname:string

    @Column({nullable:false})
    password:string

    @Column()
    phonenumber:string

    @Column()
    createdAt: Date

    @ManyToOne(()=>Roles,(role)=>role.user, {
        nullable: true, // Allow null initially for existing data
        onDelete: 'SET NULL' // If role is deleted, set user's role to null
    })
    @JoinColumn({name: 'roleId'})
    role: Roles

    //relating the user to their tasks
    @OneToMany(()=>Tasks,(task)=>task.assignedTo)
    assignedTasks: Tasks[]

    //relating lawyer to their case
    @OneToMany(()=>Cases,(cases)=>cases.assignedTo)
    Cases: Cases[]

    //relating user and appointments
    @OneToMany(()=>Appointments,(appointment)=>appointment.assignedTo)
    appointments: Appointments[]
}