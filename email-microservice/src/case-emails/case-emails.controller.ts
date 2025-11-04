import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { sendCaseDetailsDto } from './Dtos/sendCaseDetails.dto';
import { CaseEmailsService } from './case-emails.service';

@Controller('case-emails')
export class CaseEmailsController {
    constructor(private caseEmailService: CaseEmailsService){}
    @EventPattern({cmd: 'sendAssignedCaseNotification'})
    async sendTaskDetails(@Payload() {to,assignedBy,caseName}: sendCaseDetailsDto){
        await this.caseEmailService.sendEmailNotifcation(to,assignedBy,caseName)
    }
}
