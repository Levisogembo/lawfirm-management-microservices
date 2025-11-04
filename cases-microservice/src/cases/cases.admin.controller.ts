import { Controller, UseGuards } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { Roles } from "../decorators/roles.decorator";
import { RolesGuard } from "../guards/roles.guard";
import { assignCaseDetailsDto, assignCasePayloadDto, reAssignCasePayloadDto } from "./Dtos/assignCase.dto";
import { adminCaseService } from "./case.admin.service";

@Controller()
@UseGuards(RolesGuard)
export class adminCaseController {
    constructor(private adminCaseService: adminCaseService){}

    @MessagePattern({cmd:'assignNewCase'})
    @Roles('Admin')
    async assignNewCase(@Payload() {userToken,assignCaseDetails}:assignCasePayloadDto){
        return await this.adminCaseService.assignNewCase(userToken,assignCaseDetails)
    }

    @MessagePattern({cmd:'reAssignNewCase'})
    @Roles('Admin')
    async reAssignCase(@Payload() {userToken,caseDetails}:reAssignCasePayloadDto){
        return await this.adminCaseService.reAssignCase(userToken,caseDetails)
    }


}