import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Files } from '../../typeorm/entities/Files';
import { Repository } from 'typeorm';
import { S3ClientService } from '../s3-service/s3-service.service';
import { fileDetailsS3Dto, fileS3Dto, userTokenDto } from '../Dtos/uploadFile.dto';
import { ClientGrpcProxy, ClientProxy, RpcException } from '@nestjs/microservices';
import { filter, lastValueFrom } from 'rxjs';
import { updateFileDto } from '../Dtos/updateFile.dto';

@Injectable()
export class FilesS3ServiceService {
    constructor(@InjectRepository(Files) private filesRepository: Repository<Files>, @Inject('Nats_messenger') private natsClient: ClientProxy
    ) { }

    //check if there are any conflicts in the filemetata before uploading it to s3
    async checkFileEligibility(userToken: userTokenDto, { caseId, clientId, fileName }: fileDetailsS3Dto) {
        try {
            //first check to see if file name exists, it should be unique
            if (fileName) {
                const foundfilename = await this.filesRepository.findOne({ where: { fileName } })
                if (foundfilename) throw new RpcException('Filename already exists try another one')
            }
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

    async uploadS3File(userToken: userTokenDto, { clientId, caseId, originalName, s3FileUrl, s3Key, ...fileDetails }: fileDetailsS3Dto) {
        try {
            // const foundfilename = await this.filesRepository.findOne({ where: { fileName } })
            const foundClient = await lastValueFrom(this.natsClient.send({ cmd: 'getClientById' }, { userToken, id: clientId }))
            const foundCase = await lastValueFrom(this.natsClient.send({ cmd: 'searchCaseById' }, { userToken, caseId }))

            //check username
            const uploadedBy = userToken.username

            //upload new file metadata to the db by creating a custom object
            const createdFile = await this.filesRepository.create({
                ...fileDetails,
                uploadedAt: new Date(),
                uploadedBy,
                fileSize: fileDetails.size,
                Client: foundClient,
                Case: foundCase,
                s3FileUrl,
                s3Key
            })
            return await this.filesRepository.save(createdFile)
        } catch (error) {
            if (error instanceof RpcException) throw error
        }


    }

    async updateS3File(userToken: userTokenDto, fileId: string, fileMetadata: updateFileDto) {
        //no additional checks to be done at this point because the checkfile eligibility has already performed the check in the api gateway
        const { originalName, ...fileDetails } = fileMetadata
        const filteredUpates = Object.fromEntries(
            Object.entries({ ...fileDetails }).filter(([_, values]) => values !== undefined)
        )//remove enty objects before updating the WS

        const uploadedBy = userToken.username
        filteredUpates.uploadedBy = uploadedBy

        if (fileMetadata.fileSize) {
            filteredUpates.fileSize = fileMetadata.fileSize
        }

        if (fileMetadata.Client) {
            const foundClient = await lastValueFrom(this.natsClient.send({ cmd: 'getClientById' }, { userToken, id: fileMetadata.Case }))
            filteredUpates.Client = foundClient //update the case field with the object of the found client
        }
        if (fileMetadata.Case) {
            const foundCase = await lastValueFrom(this.natsClient.send({ cmd: 'searchCaseById' }, { userToken, caseId: fileMetadata.Case }))
            filteredUpates.Case = foundCase //update the case field with the object of the found client
        }

        console.log(filteredUpates);

        //update the records in the db
        await this.filesRepository.update(fileId, filteredUpates)

        //return updated file
        return await this.filesRepository.findOne({ where: { fileId } })

    }

    async deleteS3File(fileId: string){
        const file = await this.filesRepository.findOne({where:{fileId}})
        if(!file) throw new RpcException("File not found")
         await this.filesRepository.delete(fileId)
        return {msg:'File deleted successfully'}
    }


}
