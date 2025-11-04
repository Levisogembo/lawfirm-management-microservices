import { Controller, Post, Req, Body, UseGuards, UsePipes, ValidationPipe, Inject, Get, Param, ParseUUIDPipe, Query, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../users/auth/auth/guards/Jwt.guard';
import { createAppointmentDto } from './Dtos/createAppointment.dto';
import { ClientProxy } from '@nestjs/microservices';
import { last, lastValueFrom } from 'rxjs';
import { updateAppointmentDto } from './Dtos/updateAppointment.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe)
export class AppointmentsController {
    constructor(@Inject('Nats_messenger') private natsClient: ClientProxy) { }

    @Post('create')
    async createAppointment(@Req() req: Request, @Body() appointmentDetails: createAppointmentDto) {
        const userToken = req.user
        //console.log(appointmentDetails);
        const createdAppointment = await lastValueFrom(this.natsClient.send({ cmd: 'createNewAppointment' }, { userToken, appointmentDetails }))
        return { msg: 'Appointment created successfully', createdAppointment }
    }

    @Get('all')
    async getAllAppointments(@Req() req: Request,@Query('page',ParseIntPipe) page: number,
    @Query('limit',ParseIntPipe) limit: number) {
        const userToken = req.user
        const AllAppointments = await lastValueFrom(this.natsClient.send({ cmd: 'fetchAllAppointments' }, { userToken, page, limit }))
        return AllAppointments && AllAppointments.data.length ? { msg: 'success', AllAppointments } : { msg: 'No appointments at the moment' }
    }

    @Get('search')
    async searchByTitle(@Req() req: Request, @Query('title') title: string) {
        const userToken = req.user
        const foundTitle = await lastValueFrom(this.natsClient.send({ cmd: 'searchAppointmentTitles' }, { userToken, title }))
        return foundTitle && foundTitle.length ?
            { msg: 'success', hits: foundTitle.length, foundTitle } :
            { msg: "No appointments found" }
    }

    @Get('/:id')
    async getAppointmentById(@Req() req: Request, @Param('id', ParseUUIDPipe) appointmentId: string) {
        const userToken = req.user
        const foundAppointment = await lastValueFrom(this.natsClient.send({ cmd: 'searchAppointmentId' }, { userToken, appointmentId }))
        return { msg: 'success', foundAppointment }
    }

    @Patch('update/:id')
    async updateAppointment(@Req() req: Request, @Param('id', ParseUUIDPipe) appointmentId: string,
        @Body() appointmentDetails: updateAppointmentDto) {
        const userToken = req.user
        const updatedAppointment = await lastValueFrom(this.natsClient.send({ cmd: 'updateAppointmentDetails' }, { userToken, appointmentId, appointmentDetails }))
        return { msg: 'Appointment updated successfully', updatedAppointment }
    }

    @Delete('delete/:id')
    async deleteAppointment(@Req() req: Request, @Param('id', ParseUUIDPipe) appointmentId: string) {
        const userToken = req.user
        await lastValueFrom(this.natsClient.send({ cmd: 'removeAppointment' }, { userToken, appointmentId }))
        return { msg: 'Appointment deleted successfully' }
    }
}
