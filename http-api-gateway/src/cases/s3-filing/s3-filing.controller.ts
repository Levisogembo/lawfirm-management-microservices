import { Controller, Inject, UseInterceptors, Post, UploadedFile, Req, Body, UseGuards, Patch, Param, ParseUUIDPipe, UsePipes, ValidationPipe, HttpException, HttpStatus, Delete } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { memoryStorage } from 'multer';
import { uploadFileS3Dto } from './Dtos/uploadFile.dto';
import { JwtAuthGuard } from '../../users/auth/auth/guards/Jwt.guard';
import { buffer } from 'stream/consumers';
import { lastValueFrom } from 'rxjs';
import { s3ClientService } from '../../s3-client-module/s3.client.service';
import { updateFileDto } from './Dtos/updateFile.dto';
import { ConfigService } from '@nestjs/config';

@Controller('s3')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe)
export class S3FilingController {
    constructor(@Inject('Nats_messenger') private natsClient: ClientProxy, private s3ClientService: s3ClientService, private configService: ConfigService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage()
    }))
    async uploadS3Files(@UploadedFile() file: Express.Multer.File, @Req() req: Request,
        @Body() fileDetails: uploadFileS3Dto) {

        //extracting user token
        const userToken = req.user

        //check first if file details are eligible, no conflicts then proceed, also returns client name to be used in s3 key construction
        let foundClientName = await lastValueFrom(this.natsClient.send({ cmd: 'checkFileValidity' }, { userToken, fileDetails }))
        //console.log(foundClientName.clientName);

        //constructing unique keys for each file, each file in s3 is saved in folders with the client name as folder name 
        const s3Key = `${fileDetails.fileType}/${foundClientName.clientName}/${Date.now()}-${fileDetails.fileName}`
        const s3FileUrl = await this.s3ClientService.uploadFile(file, s3Key)

        const fileMetadata = {
            originalName: file.originalname || file.filename,
            mimeType: file.mimetype,
            size: file.size,
            s3Key,
            s3FileUrl,
            clientId: fileDetails.clientId,
            caseId: fileDetails.caseId,
            fileName: fileDetails.fileName,
            fileType: fileDetails.fileType
        }
        //console.log(fileMetadata);

        const payload = {
            userToken,
            fileMetadata
        }

        const s3File = await lastValueFrom(this.natsClient.send({ cmd: 'uploadFileToS3' }, payload))
        return { msg: 'Success!! File uploaded to s3', s3File }
    }

    @Patch('update/:id')
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
    async updateS3File(@UploadedFile() file: Express.Multer.File, @Param('id', ParseUUIDPipe) fileId: string,
        @Body() fileDetails: updateFileDto, @Req() req: Request) {
        //check first if file exists
        const userToken = req.user
        const foundFile = await lastValueFrom(this.natsClient.send({ cmd: 'searchFileById' }, { userToken, fileId }))
        const foundKey = Array.isArray(foundFile) ? foundFile[0].s3Key : foundFile.s3Key
        const existingKey = `${this.configService.get<string>("S3_PREFIX")}/${foundKey}` //reconstruct the prefix
        try {
            //check for validity of the filedetails provided, if there are any duplicates in the db or any conflicts
            const foundClient = await lastValueFrom(this.natsClient.send({ cmd: 'checkFileValidity' }, { userToken, fileDetails }))

            const s3FileName = fileDetails.fileName ? fileDetails.fileName : foundFile[0].fileName
            const s3Key = `${fileDetails.fileType}/${foundClient.clientName}/${Date.now()}-${s3FileName}` //new s3 key

            let fileMetadata = {} //create a custom object depending on whether there is a file or not
            //first delete the file using the s3 key extracted from the foundfile,only delete if another file is uploaded
            if (file) {

                await this.s3ClientService.deleteFile(existingKey)

                //once file is deleted upload the new file now to s3
                const s3FileUrl = await this.s3ClientService.uploadFile(file, s3Key)

                fileMetadata = {
                    originalName: file.originalname || file.filename,
                    mimeType: file.mimetype,
                    fileSize: file.size,
                    s3Key,
                    s3FileUrl,
                    Client: fileDetails.Client,
                    Case: fileDetails.Case,
                    fileName: fileDetails.fileName,
                    fileType: fileDetails.fileType
                }
            } else {
                //now update the metadata object without filedetails
                fileMetadata = {
                    Client: fileDetails.Client,
                    Case: fileDetails.Case,
                    fileName: fileDetails.fileName,
                    fileType: fileDetails.fileType
                }
            }

            //create final payload to be sent to microservice
            const payload = { userToken, fileId, fileMetadata }
            const updatedFile = await lastValueFrom(this.natsClient.send({ cmd: 'updateNewS3Files' }, payload))
            return { msg: "File updated successfully", updatedFile }
        } catch (error) {
            //if there is an error from the microservice, delete the file that is already upladed in s3
            await this.s3ClientService.deleteFile(existingKey)
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
        }
        //return existingKey
    }

    @Delete('delete/:id')
    async deleteS3File(@Param('id', ParseUUIDPipe) fileId: string, @Req() req: Request) {
        const userToken = req.user
        //make the call first to find the file, extract the s3 key from it 
        const foundFile = await lastValueFrom(this.natsClient.send({ cmd: 'searchFileById' }, { userToken, fileId }))
        const file = Array.isArray(foundFile) ? foundFile[0] : foundFile
        const s3KeyPath: string = file.s3Key
        if (s3KeyPath) {
            const prefix = await this.configService.get<string>("S3_PREFIX")
            const filePath = `${prefix}/${s3KeyPath}`
            //make the microservice call to delete the filemetadata in the db first before deleting it on s3
            await lastValueFrom(this.natsClient.send({ cmd: "deleteFile" }, { userToken, fileId }))
            
            //delete the file from s3 once confirmation from the microservice that filemetadata is deleted
            return await this.s3ClientService.deleteFile(filePath)
        }


    }
}
