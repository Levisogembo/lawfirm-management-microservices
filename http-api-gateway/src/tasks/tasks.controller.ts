import { Body, ConflictException, Controller, Get, HttpException, Inject, NotFoundException, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { createTaskDto } from './Dtos/createTask.dto';
import { JwtAuthGuard } from '../users/auth/auth/guards/Jwt.guard';
import { Request } from 'express';
import { last, lastValueFrom } from 'rxjs';
import { updateTaskDto } from './Dtos/updateTask.dto';
import { use } from 'passport';

@Controller('tasks')
export class TasksController {
    constructor(@Inject('Nats_messenger') private natsClient: ClientProxy) { }

    @Post('create')
    @UseGuards(JwtAuthGuard)
    @UsePipes(ValidationPipe)
    async createNewTask(@Req() req: Request, @Body() taskDetails: createTaskDto) {
        const userToken = req.user
            const task = await lastValueFrom(this.natsClient.send({ cmd: 'createNewTask' }, { userToken, taskDetails }))
            if (!task) throw new HttpException('user could not be found', 404)
            return {
                msg: 'success',
                task
            }
    }

    @Patch('update/:id')
    @UseGuards(JwtAuthGuard)
    @UsePipes(ValidationPipe)
    async updateTask(@Param('id', ParseUUIDPipe) taskId: string, @Body() payload: updateTaskDto) {
        const updatedTask = await lastValueFrom(this.natsClient.send({ cmd: 'updateTask' }, { taskId, payload }))
        if (!updatedTask) throw new HttpException('Task not found', 404)
        return updatedTask
    }

    @Get('all')
    @UseGuards(JwtAuthGuard)
    async getAllTasks(@Query('page',ParseIntPipe) page:number,@Query('limit',ParseIntPipe) limit:number) {
        const foundTasks = await lastValueFrom(this.natsClient.send({ cmd: 'getAllTasks' }, {page,limit}))
        if (!foundTasks) return new NotFoundException()
        const taskLength = foundTasks.data.length
        return taskLength ? { msg: 'success', foundTasks } : { msg: "No tasks found"}
    }

    @Get('pending')
    @UseGuards(JwtAuthGuard)
    async getPendingTasks(@Req() req: Request) {
        const userToken = req.user
        const pendingTasks = await lastValueFrom(this.natsClient.send({ cmd: 'getPendingTasks' }, userToken))
        const hits = pendingTasks.length
        return hits ? { hits, pendingTasks } : { msg: 'No pending tasks' }
    }

    @Get('personal')
    @UseGuards(JwtAuthGuard)
    async myTasks(@Req() req: Request) {
        const userToken = req.user
        const myTask = await lastValueFrom(this.natsClient.send({ cmd: 'getMyTasks' }, userToken))
        if (!myTask) return new HttpException('No tasks found', 404)
        const hits = myTask.length
        return hits ? { hits, myTask } : { msg: 'No pending tasks today' }

    }

}
