import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tasks } from '../typeorm/entities/Tasks';
import { Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { createTaskDto } from './Dtos/createTask.dto';
import { lastValueFrom, take } from 'rxjs';
import { updatedTaskDto } from './Dtos/updateTask.dto';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Tasks) private tasksRepository: Repository<Tasks>,
        @Inject('Nats_messenger') private natsClient: ClientProxy
    ) { }

    async createTask(userId: string, { name, ...taskDetails }: createTaskDto) {
        //check first if user exists
        try {
            const foundUser = await lastValueFrom(this.natsClient.send({ cmd: 'getEmployeeById' }, userId))
            if (!foundUser) throw new RpcException("User not found")

            //check if task name already exists
            const foundTask = await this.tasksRepository.findOne({ where: { name } })
            if (foundTask) throw new RpcException('Task Name Already exists')


            const createdTask = await this.tasksRepository.create({
                ...taskDetails,
                name, // Convert to TaskStatus // Map 'note' to 'notes'
                notes: taskDetails.notes
                    ? taskDetails.notes.map(note =>
                        typeof note === 'string' ? { message: note } : note
                    )
                    : [],
                createdAt: new Date(),
                assignedTo: foundUser, // Use userId instead of full user object

            })

            const savedTask = await this.tasksRepository.save(createdTask)
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

    async updateTask(data: updatedTaskDto) {
        const { taskId, payload } = data;
        const foundTask = await this.tasksRepository.findOne({ where: { taskId } })
        if (!foundTask) throw new RpcException("Task not found")

        // Filter out undefined properties
        const filteredUpdates = Object.fromEntries(
            Object.entries(payload).filter(([_, value]) => value !== undefined)
        );

        // Append notes instead of overwriting
        if (filteredUpdates.notes && Array.isArray(filteredUpdates.notes)) {
            const existingNotes = Array.isArray(foundTask.notes) ? foundTask.notes : [];

            // Map new notes to objects with only a "message" key
            const newNotes = filteredUpdates.notes.map((msg: any) => ({
                message: msg.message ?? msg, // support both string or { message: string }
            }));

            // Append the notes
            filteredUpdates.notes = [...existingNotes, ...newNotes];
        }
        await this.tasksRepository.update(taskId, filteredUpdates);
        return await this.tasksRepository.findOne({ where: { taskId } })

    }

    async getAllTasks(page: number, limit: number) {
        const offset = (page - 1) * limit
        const [data, total] = await this.tasksRepository.findAndCount({
            order: { createdAt: 'DESC' },
            skip: offset,
            take: limit
        })
        return {
            data,
            total,
            page,
            limit
        }
    }

    async findPendingTasks(userId: string) {
        const foundUser = await lastValueFrom(this.natsClient.send({ cmd: 'getEmployeeById' }, userId))
        if (!foundUser) return null
        //get all the user's tasks
        const tasks = await this.tasksRepository.find({
            where: { assignedTo: { id: foundUser.id } },
            relations: ['assignedTo'],
            select: {
                assignedTo: { username: true }
            }
        });
        const pendingTasks = tasks.filter((task) => task.status !== 'Completed')
        return pendingTasks
    }

    async getMyTasks(userId: string) {
        const foundUser = await lastValueFrom(this.natsClient.send({ cmd: 'getEmployeeById' }, userId))
        if (!foundUser) return null
        //get all the user's tasks
        const tasks = await this.tasksRepository.find({
            where: { assignedTo: { id: foundUser.id } },
            relations: ['assignedTo'],
            select: {
                assignedTo: { username: true }
            }
        });
        return tasks
    }
}
