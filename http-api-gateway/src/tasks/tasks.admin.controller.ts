import { Body, ConflictException, Controller, Inject, Post, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Request } from "express";
import { assignTaskDto } from "./Dtos/createTask.dto";
import { JwtAuthGuard } from "../users/auth/auth/guards/Jwt.guard";
import { log } from "node:console";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";


@Controller('adminTasks')
export class adminTasksController{
    constructor(@Inject('Nats_messenger') private natsClient: ClientProxy) { }

    @Post('assign')
    @UseGuards(JwtAuthGuard)
    @UsePipes(ValidationPipe)
    async assignTasks(@Req() req:Request,@Body() payload:assignTaskDto){
        
        try {
            const userToken = req.user
            const assignedTask = await lastValueFrom(this.natsClient.send({cmd:'assignNewTask'},{userToken, taskDetails: payload}))
            return {msg:'Task Assigned Successfully',assignedTask}
        } catch (error) {
            if(error.message == 'Task Name Already exists'){
                throw new ConflictException(error.message)
            }
            if(error.message == 'Forbidden resource'){
                throw new ConflictException(error.message)
            }
            //Forbidden resource
            throw error
            
        }
        
        
    }
}