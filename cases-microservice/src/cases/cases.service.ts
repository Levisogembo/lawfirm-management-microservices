import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Cases } from '../typeorm/entities/Cases';
import { caseDetailsDto, userTokenDto } from './Dtos/createCase.dto';
import { updatedCaseDetailsDto } from './Dtos/updateCase.dto';
import * as moment from 'moment'

@Injectable()
export class CasesService {
    constructor(
        @InjectRepository(Cases) private casesRepository: Repository<Cases>,
        @Inject('Nats_messenger') private natsClient: ClientProxy
    ) { }

    async createNewCase(userToken: userTokenDto, { caseNumber, caseNotes, client, ...caseDetails }: caseDetailsDto) {
        //check if user exists 
        try {
            const userId = userToken.id
            const foundUser = await lastValueFrom(this.natsClient.send({ cmd: 'getEmployeeById' }, userId))
            if (!foundUser) throw new RpcException('User not found')

            //check if client exists, we also attach the usertoken because the subscriber to this message is role protected
            const foundClient = await lastValueFrom(this.natsClient.send({ cmd: 'getClientById' }, { userToken, id: client }))
            if (!foundClient) throw new RpcException('Client not found')

            //check if case number exists, it should be unique for each case
            const isCaseNumber = await this.casesRepository.findOne({ where: { caseNumber } })
            if (isCaseNumber) throw new RpcException('Case number already exists')

            //creating a new case if case number is unique
            const newCase = this.casesRepository.create({
                ...caseDetails,
                caseNumber,
                caseNotes: caseNotes?.map(note =>
                    typeof note === 'string' ? { message: note } : note
                ),
                filedDate: new Date(),
                assignedTo: foundUser,
                client: foundClient
            })

            const savedCase = await this.casesRepository.save(newCase)
            return await this.casesRepository.findOne({
                where: { caseID: savedCase.caseID },
                relations: ['client', 'assignedTo'],
                select: {
                    client: { clientId: true, clientName: true },
                    assignedTo: { id: true, username: true }
                }
            })
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

    async getCaseById(caseId: string) {
        //search if case exists first
        const searchCase = await this.casesRepository.findOne({
            where: { caseID: caseId },
            relations: ['client', 'assignedTo'],
            select: {
                client: { clientId: true, clientName: true },
                assignedTo: { id: true, username: true }
            }
        })
        if (!searchCase) throw new RpcException('Case not found')
        return searchCase
    }

    async getCaseNumber(caseNumber: string) {
        //search if case exists first
        const searchCase = await this.casesRepository.findOne({
            where: { caseNumber },
            relations: ['client', 'assignedTo'],
            select: {
                client: { clientId: true, clientName: true },
                assignedTo: { id: true, username: true }
            }
        })
        if (!searchCase) throw new RpcException('Case not found')
        return searchCase
    }

    async updateCase(caseId: string, { client, caseNotes, ...updateCaseDetails }: updatedCaseDetailsDto, userToken: userTokenDto) {
        try {
            //find case if it exists
            const foundCase = await this.getCaseById(caseId)

            //check if the client is defined and if that case still exists
            if (client) {
                await lastValueFrom(this.natsClient.send({ cmd: 'getClientById' }, { userToken, id: client }))
            }

            //filtering out undefined values
            const filteredUpdates = Object.fromEntries(
                Object.entries({ client, caseNotes, ...updateCaseDetails }).filter(([_, values]) => values !== undefined)
            )

            //for the case notes, there is no overwriting for future references so we append the updated data to the existing one
            if (filteredUpdates.caseNotes && Array.isArray(filteredUpdates.caseNotes)) {
                //fetch existing notes from the foundcase object
                const existingCaseNotes = Array.isArray(foundCase.caseNotes) ? foundCase.caseNotes : []

                // Map new notes to objects with only a "message" key
                const newNotes = filteredUpdates.caseNotes.map((msg: any) => ({
                    message: msg.message ?? msg, // support both string or { message: string }
                }));

                // Append the notes
                filteredUpdates.caseNotes = [...existingCaseNotes, ...newNotes];
            }
            //only update the case if it assigned to you, compare assigned to and username from token
            const assignedUser = foundCase.assignedTo.username
            const userFromToken = userToken.username

           // if (assignedUser !== userFromToken) throw new RpcException('You cannot edit a case not assigned to you')
            //update the case
            await this.casesRepository.update(caseId, filteredUpdates)
            return await this.getCaseById(caseId)

        } catch (error) {
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

    async getUpcomingHearing() {
        //hearings are filtered according to current week,get the start of week
        const startOfWeek = moment().startOf('isoWeek').toDate()
        const endOfWeek = moment().endOf('isoWeek').toDate()

        //check to see whether the hearing date falls within the current week
        return this.casesRepository.find({
            where: {
                hearingDate: Between(startOfWeek, endOfWeek)
            },
            order: {
                hearingDate: 'ASC'
            },
            relations: ['client', 'assignedTo'],
            select: {
                client: { clientId: true, clientName: true },
                assignedTo: { id: true, username: true }
            }
        })
    }

    async getAllCases(page:number,limit:number){
        const offset = (page - 1) * limit
        const [data,total] = await this.casesRepository.findAndCount({
            relations: ['client', 'assignedTo'],
            skip: offset,
            take: limit,
            order: {filedDate:'DESC'},
            select: {
                client: { clientId: true, clientName: true },
                assignedTo: { id: true, username: true }
            }
        })
        return {
            total,
            page,
            limit,
            data
        }
    }

    async getMyUpcomingHearings(userToken:userTokenDto){
        //fetching all the upcoming hearings first before filtering
        const upcomingMentions = await this.getUpcomingHearing()
        if(!upcomingMentions) return null

        //getting the user id from the token
        const userId = userToken.id
        //filtering upcoming mentions only for the specific users
        const filteredHearings = upcomingMentions.filter((hearing)=>hearing.assignedTo.id === userId)
        return filteredHearings
    }

}
