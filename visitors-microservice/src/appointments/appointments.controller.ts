import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { createAppointmentPayloadDto, getAppointmentByIdDto, getAppointmentByTitleDto } from './Dtos/createAppointment.dto';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AppointmentsService } from './appointments.service';
import { deleteAppointmentDetailsPayloadDto, updateAppointmentDetailsPayloadDto } from './Dtos/updateAppointment.dto';
import { getAllAppointmentsDto } from './Dtos/getAppointments.dto';

@Controller('appointments')
@UseGuards(RolesGuard)
export class AppointmentsController {
    constructor(private appointmentsService: AppointmentsService){}

    @MessagePattern({cmd:'createNewAppointment'})
    @Roles('Admin','Lawyer')
    async createAppointment(@Payload() {userToken,appointmentDetails}:createAppointmentPayloadDto){
        return await this.appointmentsService.createAppointment(userToken,appointmentDetails)
    }   

    @MessagePattern({cmd:'fetchAllAppointments'})
    @Roles('Admin','Lawyer','Receptionist')
    async getAllAppointment(@Payload() {page,limit}:getAllAppointmentsDto){
        return await this.appointmentsService.getAllAppointments(page,limit)
    }

    @MessagePattern({cmd:'searchAppointmentId'})
    @Roles('Admin','Lawyer','Receptionist')
    async getAppointmentById(@Payload() {appointmentId}: getAppointmentByIdDto){
        return await this.appointmentsService.getAppointmentById(appointmentId)
    }

    @MessagePattern({cmd:'searchAppointmentTitles'})
    @Roles('Admin','Lawyer','Receptionist')
    async searchByTitle(@Payload() {title}: getAppointmentByTitleDto){
        return await this.appointmentsService.searchByTitle(title)
    }

    @MessagePattern({cmd:'updateAppointmentDetails'})
    @Roles('Admin','Lawyer')
    async updateAppointment(@Payload() {userToken,appointmentId,appointmentDetails}: updateAppointmentDetailsPayloadDto){
        return await this.appointmentsService.updateAppointment(userToken,appointmentId,appointmentDetails)
    }

    @MessagePattern({cmd:'removeAppointment'})
    @Roles('Admin','Lawyer')
    async deleteAppointment(@Payload() {appointmentId}: deleteAppointmentDetailsPayloadDto){
        return await this.appointmentsService.deleteAppointment(appointmentId)
    }
}
