import { Controller, UseGuards } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { assignTaskDto } from "./Dtos/createTask.dto";
import { adminTaskService } from "./tasks.admin.service";
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from "../guards/roles.guard";

@Controller('adminTasks')
export class adminTasksController {
    constructor( private adminTaskService: adminTaskService){}

    @MessagePattern({cmd:'assignNewTask'})
    @Roles('Admin')
    @UseGuards(RolesGuard)
    async assignTasks(@Payload() payload: assignTaskDto){
        const {userToken,taskDetails} = payload
        const adminId = userToken.id
        return await this.adminTaskService.assignTask(adminId,taskDetails)
    }
}