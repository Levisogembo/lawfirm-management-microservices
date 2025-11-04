import { Body, Controller, Get, Inject, NotFoundException, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { createCaseDto } from './Dtos/createCase.dto';
import { JwtAuthGuard } from '../../users/auth/auth/guards/Jwt.guard';
import { last, lastValueFrom } from 'rxjs';
import { updateCaseDetailsDto } from './Dtos/updateCase.dto';

@Controller('case')
@UseGuards(JwtAuthGuard)
@UsePipes(ValidationPipe)
export class CaseController {
    constructor(@Inject('Nats_messenger') private natsClient: ClientProxy) { }

    @Post('create')
    async createNewCase(@Req() req: Request, @Body() caseDetails: createCaseDto) {
        const userToken = req.user
        const newCase = await lastValueFrom(this.natsClient.send({ cmd: 'createNewCase' }, { userToken, caseDetails }))
        return {
            msg: 'New Case Created', newCase
        }
        // try {
        //     const userToken = req.user
        //     const newCase = await lastValueFrom(this.natsClient.send({ cmd: 'createNewClient' }, { userToken, caseDetails }))
        //     return {
        //         msg: 'New Case Created', newCase
        //     }

        // } catch (error) {
        //     if (error.message === 'User not found') throw new NotFoundException(error.message)
        //     if (error.message === 'Client not found') throw new NotFoundException(error.message)
        //     if (error.message === 'Case number already exists') throw new NotFoundException(error.message)
        //     if (error.message === 'Forbidden resource') throw new NotFoundException(error.message)    //
        //     throw error
        // }
    }

    @Get('search/:id')
    async getCaseById(@Req() req: Request, @Param('id', ParseUUIDPipe) caseId: string) {
        const userToken = req.user
        const foundCase = await lastValueFrom(this.natsClient.send({ cmd: 'searchCaseById' }, { userToken, caseId }))
        return { msg: 'success', foundCase }
    }

    @Get('casenumber')
    async getCaseNumber(@Req() req: Request, @Query('caseNum') caseNumber: string) {
        const userToken = req.user
        const foundCase = await lastValueFrom(this.natsClient.send({ cmd: 'searchCaseByCaseNum' }, { userToken, caseNumber }))
        return { msg: 'success', foundCase }
    }

    @Patch('update/:id')
    async updateCase(@Req() req: Request, @Body() caseUpdateDetails: updateCaseDetailsDto,
        @Param('id', ParseUUIDPipe) caseId: string
    ) {
        const userToken = req.user
        const updatedCase = await lastValueFrom(this.natsClient.send({ cmd: 'updatedCaseDetails' }, { userToken, caseUpdateDetails, caseId}))
        return updatedCase
    }

    @Get('upcoming')
    async getUpcomingHearings(@Req() req: Request){
        const userToken = req.user
        const upcomingMentions = await  lastValueFrom(this.natsClient.send({cmd:'getUpcomingHearings'},{userToken}))
        return upcomingMentions.length ? {msg:'success',hits:upcomingMentions.length,upcomingMentions} : {msg:'No upcoming hearings this week'}
    }

    @Get('all')
    async getAllCases(@Req() req: Request,@Query('page',ParseIntPipe) page:string,@Query('limit',ParseIntPipe) limit:string){
        const userToken = req.user
        const allCases = await lastValueFrom(this.natsClient.send({cmd:'getAllCases'},{userToken,page,limit}))
        return allCases.data.length ? {msg:'success', allCases} : {msg:'No cases available'}
    }

    @Get('myhearings')
    async getMyHearings(@Req() req: Request){
        const userToken = req.user
        const myHearing = await lastValueFrom(this.natsClient.send({cmd:'searchMyHearings'},{userToken}))
        return myHearing.length ? {msg:'success',hits:myHearing.length,myHearing} : {msg:'No upcoming hearings this week'}

    }

}
