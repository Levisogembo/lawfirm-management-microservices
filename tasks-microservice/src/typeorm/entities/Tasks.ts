import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { TaskPriorities, TaskStatus } from "./enums/tasks.enums";

@Entity({name:'tasks'})
export class Tasks {

    @PrimaryGeneratedColumn('uuid')
    taskId: string

    @Column({nullable:false,unique:true})
    name: string

    @Column({default:TaskStatus.Not_started})
    status: TaskStatus

    @Column('simple-json',{nullable:true})
    notes: { message: string }[];

    @Column({nullable:false})
    priority: TaskPriorities

    @Column()
    createdAt: Date

    @Column({nullable:true})
    completedAt: Date

    //relating users to their tasks
    @ManyToOne(()=>User,(user)=>user.assignedTasks)
    @JoinColumn({name: 'assigned_to'})
    assignedTo: User

    @Column({nullable:true})
    assignedBy: string
}