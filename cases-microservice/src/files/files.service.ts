import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Files } from '../typeorm/entities/Files';
import { ILike, Repository } from 'typeorm';
import { fileUploadPayloadDto, userTokenDto } from './Dtos/uploadFile.dto';
import { lastValueFrom } from 'rxjs';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { combinedSearchObjectDto, searchCriteriaDto } from './Dtos/searchFile.dto';
import { updateFileDto, updateFilePayloadDto } from './Dtos/updateFile.dto';

@Injectable()
export class FilesService {
    constructor(@InjectRepository(Files) private filesRepository: Repository<Files>,
        @Inject('Nats_messenger') private natsClient: ClientProxy
    ) { }

    async uploadNewFile({ userToken, fileMetadata }: fileUploadPayloadDto) {
        try {
            //first check to see if file name exists, it should be unique
            const foundfilename = await this.filesRepository.findOne({ where: { fileName: fileMetadata.fileName } })
            if (foundfilename) throw new RpcException('Filename already exists try another one')

            const client = fileMetadata.clientId
            const caseId = fileMetadata.caseId
            //check if client exists, we also attach the usertoken because the subscriber to this message is role protected
            const foundClient = await lastValueFrom(this.natsClient.send({ cmd: 'getClientById' }, { userToken, id: client }))
            if (!foundClient) throw new RpcException('Client not found')


            //checking if case exists
            const foundCase = await lastValueFrom(this.natsClient.send({ cmd: 'searchCaseById' }, { userToken, caseId }))

            //fetch the username from the token to know who is uploading the file
            const uploadedBy = userToken.username
            //start creating filemetadata in the db
            const newFile = await this.filesRepository.create({
                ...fileMetadata,
                Client: foundClient,
                Case: foundCase,
                filepath: fileMetadata.filePath,
                uploadedBy,
                uploadedAt: new Date()
            })
            return await this.filesRepository.save(newFile)
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

    async getAllFiles(page:number,limit:number) {
        const offset = (page - 1) * limit
        const [data,total] = await this.filesRepository.findAndCount({
            relations: ['Case', 'Client'],
            select: {
                Case: {caseID:true,caseNumber:true,caseTitle:true},
                Client: {clientId:true,clientName:true}
            },
            order: {uploadedAt: 'DESC'},
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

    async getFileById(fileId: string) {
        const file = await this.filesRepository.findOne({
            where: {fileId},
            relations: ['Case', 'Client'],
            select: {
                Case: {caseID:true,caseNumber:true,caseTitle:true},
                Client: {clientId:true,clientName:true}
            }
        })
        if(!file) throw new RpcException("File not found")
        return file
    }

    async searchFileCriteria(searchCriteria: searchCriteriaDto) {
        //defining a custom where object that will do a typeorm search based on the filters provided
        const searchObject: combinedSearchObjectDto = {}
        if (searchCriteria.client) {
            searchObject.Client = { clientName: ILike(`%${searchCriteria.client}%`) } //creating a partial match
        }
        if (searchCriteria.caseNumber) {
            searchObject.Case = { caseNumber: ILike(`%${searchCriteria.caseNumber}%`) }
        }
        if (searchCriteria.filename) {
            searchObject.fileName = ILike(`%${searchCriteria.filename}%`)
        }

        const foundFile = await this.filesRepository.find({
            relations: ['Case', 'Client'],
            where: searchObject,
            order: { uploadedAt: 'DESC' },
            select: {
                Case: { caseID: true, caseTitle: true, caseNumber: true, caseType: true },
                Client: { clientId: true, clientName: true }
            }
        })
        if (foundFile.length === 0) throw new RpcException('File not found')
        return foundFile
    }

    async updateFileMetadata(userToken:userTokenDto,id:string,{fileName,Case,Client,diskName,originalName,...fileDetails}:updateFileDto) {
        try {
            //filterout undefined variables 
            const filteredObject =  Object.fromEntries(
                Object.entries({fileName,Case,Client,...fileDetails}).filter(([_,value])=>value !== undefined)
            )
            //check if file exists
            const fileExists = await this.filesRepository.findOne({ where: { fileId: id } })
            if (!fileExists) throw new RpcException('File not found')
            
            //checking if filename is defined and ensure it is unique
            if(fileName){
                const foundFile = await this.filesRepository.findOne({where:{fileName}})
                if(foundFile) throw new RpcException('Filename already exists try another one')
            }
            
            //checking if case is defined and if it exists
            if(Case){
                const foundCase = await lastValueFrom (this.natsClient.send({cmd:'searchCaseById'},{userToken,caseId:Case}))
                filteredObject.Case = foundCase
                // await this.filesRepository.findOne({where:{Case}})
            }

            if(Client){
                const foundClient = await lastValueFrom (this.natsClient.send({cmd:'getClientById'},{userToken,id:Client}))
                filteredObject.Client = foundClient
            }
            filteredObject.uploadedBy = userToken.username
            console.log(filteredObject);
            
            await this.filesRepository.update(id,filteredObject)
            return await this.getFileById(id)

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

    async deleteLocalFile(fileId:string){
        await this.getFileById(fileId)
        await this.filesRepository.delete(fileId)
        return {msg:'File deleted successfully'}
    }
}
