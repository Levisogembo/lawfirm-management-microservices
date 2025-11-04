import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CasesService } from './cases.service';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { createCasePayloadDto, getMyUpcomingHearingsDto, userTokenDto } from './Dtos/createCase.dto';
import { searchCaseByIdDto, searchCaseByNumberDto } from './Dtos/searchCase.dto';
import { caseUpdateDto } from './Dtos/updateCase.dto';

@Controller('clients')
@UseGuards(RolesGuard)
export class CasesController {
    constructor(private casesService: CasesService){}

    @MessagePattern({cmd:'createNewCase'})
    @Roles('Admin','Lawyer')
    async createNewCase(@Payload() {userToken,caseDetails}:createCasePayloadDto){
       return await this.casesService.createNewCase(userToken,caseDetails)
    }

    @MessagePattern({cmd:'searchCaseById'})
    @Roles('Admin','Lawyer','Receptionist')
    async getCaseById(@Payload() {caseId}: searchCaseByIdDto){
        return await this.casesService.getCaseById(caseId)
    }

    @MessagePattern({cmd:'searchCaseByCaseNum'})
    @Roles('Admin','Lawyer')
    async getCaseByNumber(@Payload() {caseNumber}: searchCaseByNumberDto){
        return await this.casesService.getCaseNumber(caseNumber)
    }

    @MessagePattern({cmd:'updatedCaseDetails'})
    @Roles('Admin','Lawyer')
    async updateCase (@Payload() {caseId,caseUpdateDetails,userToken}:caseUpdateDto) {
        return await this.casesService.updateCase(caseId,caseUpdateDetails,userToken)
    }

    //get upcoming cases
    @MessagePattern({cmd:'getUpcomingHearings'})
    @Roles('Admin','Lawyer','Receptionist')
    async getUpcomingHearings(){
        return await this.casesService.getUpcomingHearing()
    }

    @MessagePattern({cmd:'getAllCases'})
    @Roles('Admin','Lawyer','Receptionist')
    async getAllCases(@Payload() {page,limit}:{userToken:userTokenDto,page:number,limit:number}){
        return await this.casesService.getAllCases(page,limit)
    }

    @MessagePattern({cmd:'searchMyHearings'})
    @Roles('Admin','Lawyer')
    async getMyHearings(@Payload() {userToken}: getMyUpcomingHearingsDto){
        const foundHearings = await this.casesService.getMyUpcomingHearings(userToken)
        return foundHearings
    }



}
