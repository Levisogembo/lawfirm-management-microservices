import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Tasks } from "../typeorm/entities/Tasks";
import { Repository } from "typeorm";
import { assignNewDto } from "./Dtos/createTask.dto";
import { lastValueFrom } from "rxjs";
import { ClientProxy, RpcException } from "@nestjs/microservices";

@Injectable()
export class adminTaskService {
    constructor(@InjectRepository(Tasks) private tasksRepository: Repository<Tasks>,
        @Inject('Nats_messenger') private natsClient: ClientProxy) { }

    async assignTask(adminId: string, { assignedTo, name, ...taskDetails }: assignNewDto) {
        try {
            //check first if user exists 
            const foundUser = await lastValueFrom(this.natsClient.send({ cmd: 'getEmployeeById' }, assignedTo))
            if (!foundUser) throw new RpcException("User not found")

            //fetch admin details 
            const foundAdmin = await lastValueFrom(this.natsClient.send({ cmd: 'getEmployeeById' }, adminId))
            if (!foundAdmin) throw new RpcException("User not found")

            //check if task name already exists
            const foundTask = await this.tasksRepository.findOne({ where: { name } })
            if (foundTask) throw new RpcException('Task Name Already exists')

            //assign the new task
            const assignedTask = await this.tasksRepository.create({
                ...taskDetails,
                name,
                createdAt: new Date(),
                notes: taskDetails.notes
                    ? taskDetails.notes.map(note =>
                        typeof note === 'string' ? { message: note } : note
                    )
                    : [],
                assignedTo: foundUser,
                assignedBy: foundAdmin.username
            })
            const savedTask = await this.tasksRepository.save(assignedTask)
            //send email notification once a user has been assigned a new task
            const recipient = foundUser.email
            const admin = foundAdmin.username
            await this.natsClient.emit({ cmd: 'sendAssignedTaskNotification' }, { to: recipient, assignedBy: admin, task: savedTask.name })
            
            return await this.tasksRepository.findOne({
                where: {
                    taskId: savedTask.taskId,
                },
                relations: ['assignedTo'],
                select: {
                    assignedTo: {
                        username: true
                    }
                }
            })
        } catch (error) {
            if (error instanceof RpcException) {
                throw error
            }
            const extractedMessage =
                (typeof error === 'object' && error !== null && (error as any).message)
                    ? (error as any).message
                    : (typeof error === 'object' && error !== null && (error as any).error)
                        ? (error as any).error
                        : (typeof error === 'string')
                            ? error
                            : 'Unexpected error'
            throw new RpcException(extractedMessage)
        }
    }
}