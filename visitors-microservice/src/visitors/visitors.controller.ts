import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { createVisitorPayloadDto } from './Dtos/createVisitor.dto';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { VisitorsService } from './visitors.service';
import { updateVisitorPayloadDto } from './Dtos/updateVisitor.dto';
import { deleteVisitorDto } from './Dtos/deleteVisitor.dto';
import { searchVisitorDto } from './Dtos/searchVisitor.dto';

@Controller('visitors')
@UseGuards(RolesGuard)
export class VisitorsController {
    constructor(private visitorService: VisitorsService) {}

    @MessagePattern({cmd:'createNewVisitor'})
    @Roles('Receptionist')
    async registerVisitor(@Payload() {visitorDetails}: createVisitorPayloadDto){
        return await this.visitorService.registerVisitor(visitorDetails)
    }

    @MessagePattern({cmd:'findAllVisitors'})
    @Roles('Receptionist','Admin','Lawyer')
    async getAllVisitors(@Payload() {page,limit}){
        console.log(page,limit);
        
        return await this.visitorService.getAllVisitors(page,limit)
    }

    @MessagePattern({cmd:'updateVisitorDetails'})
    @Roles('Receptionist')
    async updateVisitor(@Payload() {visitorId,visitorDetails}: updateVisitorPayloadDto){
        return await this.visitorService.updateVisitor(visitorId,visitorDetails)
    }

    @MessagePattern({cmd:'deleteVisitorDetails'})
    @Roles('Receptionist','Admin')
    async deleteVisitor(@Payload() {visitorId}: deleteVisitorDto){
        return await this.visitorService.deleteVisitorDto(visitorId)
    }

    @MessagePattern({cmd:'searchForVisitor'})
    @Roles('Receptionist','Admin','Lawyer')
    async searchForVisitor(@Payload() {fullName}: searchVisitorDto){
        return await this.visitorService.searchVisitor(fullName)
    }
}
