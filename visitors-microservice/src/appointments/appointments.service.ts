import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointments } from '../typeorm/entities/Appointments';
import { ILike, LessThan, MoreThan, Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { createAppointmentDto, userTokenDto } from './Dtos/createAppointment.dto';
import * as moment from 'moment'
import { updateAppointmentDto } from './Dtos/updateAppointment.dto';

@Injectable()
export class AppointmentsService {
    constructor(@InjectRepository(Appointments) private appointmentRepository: Repository<Appointments>,
        @Inject('Nats_messenger') private natsClient: ClientProxy) { }

    async checkFileEligibility(userToken: userTokenDto, caseId?: string, clientId?: string) {
        try {

            let foundClient: any
            if (clientId) {
                //check if client exists, we also attach the usertoken because the subscriber to this message is role protected
                foundClient = await lastValueFrom(this.natsClient.send({ cmd: 'getClientById' }, { userToken, id: clientId }))
                if (!foundClient) throw new RpcException('Client not found')
            }

            if (caseId) {
                //checking if case exists
                const foundCase = await lastValueFrom(this.natsClient.send({ cmd: 'searchCaseById' }, { userToken, caseId }))
                if (!foundCase) throw new RpcException('Case not found')

            }
            if (foundClient) {
                return { clientName: foundClient.clientName }
            } else {
                return { msg: 'No client name found' }
            }
        } catch (error) {
            // Normalize any upstream errors (including plain objects) to RpcException
            if (error instanceof RpcException) {
                throw error
            }
            const extractedMessage =
                (typeof error === 'object' && error !== null && (error as any).message)
                    ? (error as any).message
                    : (typeof error === 'object' && error !== null && (error as any).error)
                        ? (error as any).error
                        : (typeof error === 'string')
                            ? error
                            : 'Unexpected error'
            throw new RpcException(extractedMessage)
        }
    }

    async createAppointment(userToken: userTokenDto, appointmentDetails: createAppointmentDto) {
        let caseId = appointmentDetails.case
        let clientId = appointmentDetails.client
        //check to see if client or case exists before continuing with creating the appointment
        await this.checkFileEligibility(userToken, caseId, clientId)

        //get user, client and case object
        let foundCase
        if(caseId){
            foundCase = await lastValueFrom(this.natsClient.send({ cmd: 'searchCaseById' }, { userToken, caseId }))
        } 

        const foundClient = await lastValueFrom(this.natsClient.send({ cmd: 'getClientById' }, { userToken, id: clientId }))
        const userId = userToken.id
        const foundUser = await lastValueFrom(this.natsClient.send({ cmd: 'getEmployeeById' }, userId))

        const startTime = appointmentDetails.startTime
        const endTime = appointmentDetails.endTime
        const dateToday = new Date()
        //check to see startTime and endtime are not less than today's date 
        if (moment(startTime).isBefore(dateToday)) throw new RpcException("Appointment start time can't be before today's date")
        if (moment(endTime).isBefore(dateToday)) throw new RpcException("Appointment end time can't be before today's date")

        //check to see that endTime is always after startTime
        if (moment(endTime).isSameOrBefore(startTime)) throw new RpcException("Appointment end time can't be before or same time as start time")

        //check to see if the appointment startTime and endTime is not between a timeline of a previous appointment that already exists
        const assignedPerson = userToken.id //check appointments assignment to signed in user
        const isValidStartTime = await this.appointmentRepository.find({
            where: {
                assignedTo: { id: assignedPerson },
                startTime: LessThan(endTime), //start time for a new appointment should always be greater than existing endtime
                endTime: MoreThan(startTime)
            }
        })
        if (isValidStartTime.length > 0) throw new RpcException('This appointment timeline conflicts with an existing one.')

        //create a new appointment with no conflicts
        const newAppointment = this.appointmentRepository.create({
            title: appointmentDetails.title,
            startTime: appointmentDetails.startTime,
            endTime: appointmentDetails.endTime,
            location: appointmentDetails.location,
            client: foundClient,
            case: foundCase,
            notes: appointmentDetails.notes?.map((note) => ({ message: note.message })),
            createdAt: new Date(),
            assignedTo: foundUser
        })
        return await this.appointmentRepository.save(newAppointment)
    }

    async getAllAppointments(page:number,limit:number) {
        const offset = (page - 1) * limit
        const [data,total] =  await this.appointmentRepository.findAndCount({
            relations: ['client', 'case', 'assignedTo'],
            select: {
                case: { caseID: true, caseNumber: true, caseTitle: true },
                client: { clientId: true, clientName: true },
                assignedTo: { id: true, username: true }
            },
            order: { startTime: 'DESC' },
            skip: offset,
            take: limit
        })
        return {
            total,
            page,
            limit,
            data
        }
    }

    async getAppointmentById(appointmentId: string) {
        let foundAppointment = await this.appointmentRepository.findOne({ where: { appointmentId } })
        if (!foundAppointment) throw new RpcException("Appointment not found")
        return await this.appointmentRepository.findOne({
            where: { appointmentId },
            relations: ['client', 'case', 'assignedTo'],
            select: {
                case: { caseID: true, caseNumber: true, caseTitle: true },
                client: { clientId: true, clientName: true },
                assignedTo: { id: true, username: true }
            }
        })
    }

    async searchByTitle(title: string) {
        let foundAppointment = await this.appointmentRepository.find({ where: { title: ILike(`%${title}%`) } })
        if (!foundAppointment) throw new RpcException("Appointment not found")
        return await this.appointmentRepository.find({
            relations: ['client', 'case', 'assignedTo'],
            select: {
                case: { caseID: true, caseNumber: true, caseTitle: true },
                client: { clientId: true, clientName: true },
                assignedTo: { id: true, username: true }
            }
        })
    }

    async updateAppointment(userToken: userTokenDto, appointmentId: string, appointmentDetails: updateAppointmentDto) {
        //check if appointment exists
        let foundAppointment = await this.getAppointmentById(appointmentId)
        ////check to see if client or case exists before continuing with creating the appointment
        let caseId = appointmentDetails.case
        if (caseId) await this.checkFileEligibility(userToken, caseId, "")
        let clientId = appointmentDetails.client
        if (clientId) await this.checkFileEligibility(userToken,"",clientId)
        const startTime = appointmentDetails.startTime
        const endTime = appointmentDetails.endTime
        if (startTime || endTime) {
            const dateToday = new Date()
            // validate provided fields independently
            if (startTime && moment(startTime).isBefore(dateToday)) {
                throw new RpcException("Appointment start time can't be before today's date")
            }
            if (endTime && moment(endTime).isBefore(dateToday)) {
                throw new RpcException("Appointment end time can't be before today's date")
            }

            // if both provided, ensure ordering and check for conflicts
            if (startTime && endTime) {
                if (moment(endTime).isSameOrBefore(startTime)) {
                    throw new RpcException("Appointment end time can't be before or same time as start time")
                }

                const assignedPerson = userToken.id //check appointments assignment to signed in user
                const isValidStartTime = await this.appointmentRepository.find({
                    where: {
                        assignedTo: { id: assignedPerson },
                        startTime: LessThan(endTime), //start time for a new appointment should always be greater than existing endtime
                        endTime: MoreThan(startTime)
                    }
                })
                if (isValidStartTime.length > 0) throw new RpcException('This appointment timeline conflicts with an existing one.')
            }
        }

        //filter out undefined objects and create new object
        const filteredObject =  Object.fromEntries(
            Object.entries(appointmentDetails).filter((_,values)=>values !== undefined)
        )
        if(caseId){
           const foundCase = await lastValueFrom(this.natsClient.send({ cmd: 'searchCaseById' }, { userToken, caseId }))
           filteredObject.case = foundCase 
        }if(clientId){
            const foundClient = await lastValueFrom(this.natsClient.send({ cmd: 'getClientById' }, { userToken, id: clientId }))
            filteredObject.client = foundClient
        }if(appointmentDetails.notes){
            const existingNotes = Array.isArray(foundAppointment?.notes) ? foundAppointment.notes : []
            filteredObject.notes = [...existingNotes,appointmentDetails.notes?.map((note) => ({ message: note.message }))]
        }
        //update the db with the new details
        await this.appointmentRepository.update(appointmentId,filteredObject)
        return await this.getAppointmentById(appointmentId)
    }

    async deleteAppointment(appointmentId:string){
        await this.getAppointmentById(appointmentId)
        return await this.appointmentRepository.delete(appointmentId)
    }

}
