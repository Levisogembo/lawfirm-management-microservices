import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { createTaskDto, payloadDto, userTokenDto } from './Dtos/createTask.dto';
import { TasksService } from './tasks.service';
import { updatedTaskDto } from './Dtos/updateTask.dto';

@Controller('tasks')
export class TasksController {
    constructor(private taskService: TasksService) { }

    @MessagePattern({ cmd: 'createNewTask' })
    async createNewTask(@Payload() { userToken, taskDetails }: payloadDto) {
        const { id } = userToken
        return await this.taskService.createTask(id, taskDetails)
    }

    @MessagePattern({ cmd: 'updateTask' })
    async updateTask(@Payload() payload: updatedTaskDto) {
        return await this.taskService.updateTask(payload)
    }

    @MessagePattern({ cmd: 'getAllTasks' })
    async getAllTasks(@Payload() { page, limit }: { page: number, limit: number }) {
        return await this.taskService.getAllTasks(page, limit)
    }

    @MessagePattern({ cmd: 'getPendingTasks' })
    async getPendingTasks(@Payload() { id, ...userToken }: userTokenDto) {
        return await this.taskService.findPendingTasks(id)
    }

    @MessagePattern({ cmd: 'getMyTasks' })
    async myTasks(@Payload() { id, ...userToken }: userTokenDto) {
        return await this.taskService.getMyTasks(id)
    }
}
