import { Controller } from '@nestjs/common';
import { EventPattern, Payload} from '@nestjs/microservices'
import { sendTaskDetailsDto } from './Dtos/sendTaskEmail.dto';
import { TaskEmailsService } from './task-emails.service';

@Controller('task-emails')
export class TaskEmailsController {
    constructor(private taskEmailService: TaskEmailsService){}

    @EventPattern({cmd: 'sendAssignedTaskNotification'})
    async sendTaskDetails(@Payload() {to,assignedBy,task}: sendTaskDetailsDto){
        await this.taskEmailService.sendEmailNotifcation(to,assignedBy,task)
    }

}
