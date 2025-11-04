import { Controller, UseGuards, Inject, Post, Req, Body, UsePipes, ValidationPipe, Get, Patch, Param, ParseUUIDPipe, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { JwtAuthGuard } from '../users/auth/auth/guards/Jwt.guard';
import { createVisitorDto } from './Dtos/createVisitor.dto';
import { lastValueFrom } from 'rxjs';
import { updateVisitorDto } from './Dtos/updateVisitor.dto';

@Controller('visitors')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe)
export class VisitorsController {
    constructor(@Inject('Nats_messenger') private natsClient: ClientProxy) { }

    @Post('create')
    async registerVisitor(@Req() req: Request, @Body() visitorDetails: createVisitorDto) {
        const userToken = req.user
        const newVisitor = await lastValueFrom(this.natsClient.send({ cmd: 'createNewVisitor' }, { userToken, visitorDetails }))
        return { msg: 'Success', newVisitor }
    }

    @Get()
    async getAllVisitors(@Req() req: Request, @Query('page', ParseIntPipe) page: number,
        @Query('limit', ParseIntPipe) limit: number) {
        const userToken = req.user
        const allVisitors = await lastValueFrom(this.natsClient.send({ cmd: 'findAllVisitors' }, { userToken,page,limit }))
        const visitorsLength = allVisitors.length
        return visitorsLength ? { msg: 'success', allVisitors } : { msg: 'No visitors at the moment' }
    }

    @Patch('update/:id')
    async updateVisitor(@Param('id', ParseUUIDPipe) visitorId: string, @Req() req: Request, @Body() visitorDetails: updateVisitorDto) {
        const userToken = req.user
        const updatedVisitor = await lastValueFrom(this.natsClient.send({ cmd: 'updateVisitorDetails' }, { userToken, visitorId, visitorDetails }))
        return { msg: 'visitor updated successfully', updatedVisitor }
    }

    @Delete('delete/:id')
    async deleteVisitor(@Param('id', ParseUUIDPipe) visitorId: string, @Req() req: Request) {
        const userToken = req.user
        const deletedUser = await lastValueFrom(this.natsClient.send({ cmd: 'deleteVisitorDetails' }, { userToken, visitorId }))
        return deletedUser
    }

    @Get('search')
    async searchVisitorByName(@Query('name') fullName: string, @Req() req: Request) {
        const userToken = req.user
        const foundVisitor = await lastValueFrom(this.natsClient.send({ cmd: 'searchForVisitor' }, { userToken, fullName }))
        return { msg: 'success', hits: foundVisitor.length, foundVisitor }
    }
}
