import { Injectable, Inject } from "@nestjs/common";
import { ClientProxy, RpcException } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { Cases } from "../typeorm/entities/Cases";
import { Repository } from "typeorm";
import { assignCaseDetailsDto, reAssignedDto, userTokenDto } from "./Dtos/assignCase.dto";
import { lastValueFrom } from "rxjs";
import { caseDetailsDto } from "./Dtos/createCase.dto";



@Injectable()
export class adminCaseService {
    constructor(
        @InjectRepository(Cases) private casesRepository: Repository<Cases>,
        @Inject('Nats_messenger') private natsClient: ClientProxy
    ) { }

    async assignNewCase(userToken: userTokenDto, { assignTo, caseNumber, client, caseNotes, ...caseDetails }: assignCaseDetailsDto) {
        //check if user exists 
        try {
            const foundUser = await lastValueFrom(this.natsClient.send({ cmd: 'getEmployeeById' }, assignTo))
            if (!foundUser) throw new RpcException('User not found')

            //check if client exists, we also attach the usertoken because the subscriber to this message is role protected
            const foundClient = await lastValueFrom(this.natsClient.send({ cmd: 'getClientById' }, { userToken, id: client }))
            if (!foundClient) throw new RpcException('Client not found')

            // //check if case number exists, it should be unique for each case
            const isCaseNumber = await this.casesRepository.findOne({ where: { caseNumber } })
            if (isCaseNumber) throw new RpcException('Case number already exists')

            //extract the admin username from the token
            const assignedBy = userToken.username

            //creating a new case if case number is unique
            const newCase = this.casesRepository.create({
                ...caseDetails,
                caseNumber,
                caseNotes: caseNotes?.map(note =>
                    typeof note === 'string' ? { message: note } : note
                ),
                filedDate: new Date(),
                assignedTo: foundUser,
                client: foundClient,
                assignedBy
            })

            const savedCase = await this.casesRepository.save(newCase)

            //send email notification once a user has been assigned a new case
            const recipient = foundUser.email
            const admin = userToken.username
            await this.natsClient.emit({ cmd: 'sendAssignedCaseNotification' }, { to: recipient, assignedBy: admin, caseName: savedCase.caseTitle })

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

    async reAssignCase(userToken: userTokenDto, { assignTo, caseId }: reAssignedDto) {
        try {
            const foundUser = await lastValueFrom(this.natsClient.send({ cmd: 'getEmployeeById' }, assignTo))
            if (!foundUser) throw new RpcException('User not found')

            //search for case
            const foundCase = await this.casesRepository.findOne({ where: { caseID: caseId } })
            if (!foundCase) throw new RpcException('Case not found')

            //check the role of the founduser as a case can only be assigned to a lawyer or admin
            const foundRole = foundUser.role.role
            if (foundRole === 'Receptionist') throw new RpcException('Case cannot be assigned to unauthorized roles')

            //reassign case to appropriate roles
            const assignedBy = userToken.username
            const updatePayload = { assignedTo: foundUser, assignedBy }
            await this.casesRepository.update({ caseID: caseId }, updatePayload)

            //send email notification once a user has been assigned a new case
            const recipient = foundUser.email
            const admin = userToken.username
            await this.natsClient.emit({ cmd: 'sendAssignedCaseNotification' }, { to: recipient, assignedBy: admin, caseName: foundCase.caseTitle})

            //return the reassigned case
            return await this.casesRepository.findOne({
                where: { caseID: caseId },
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
}