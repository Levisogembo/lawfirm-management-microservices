import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { Roles } from '../../decorators/roles.decorator';
import { s3UEligibilityPayloadDto, s3UploadPayloadDto } from '../Dtos/uploadFile.dto';
import { FilesS3ServiceService } from '../files-s3-service/files.s3.service.service';
import { s3UpdateFilePayloadDto } from '../Dtos/updateFile.dto';
import { deletedFileDto } from '../Dtos/deleteFile.dto';
import { RolesGuard } from '../../guards/roles.guard';

@Controller('files-s3-controller')
@UseGuards(RolesGuard)
export class FilesS3ControllerController {
    constructor(private s3FileService: FilesS3ServiceService){}

    @MessagePattern({cmd: 'checkFileValidity'})
    @Roles('Admin','Receptionist','Lawyer')
    async checkFileEligibility(@Payload() {userToken,fileDetails}:s3UEligibilityPayloadDto){
        if(!fileDetails) throw new RpcException("No file details provided")
        return await this.s3FileService.checkFileEligibility(userToken,fileDetails)
    }

    @MessagePattern({cmd: 'uploadFileToS3'})
    @Roles('Admin','Receptionist','Lawyer')
    async uploadS3File(@Payload() {userToken,fileMetadata}:s3UploadPayloadDto){
        return await this.s3FileService.uploadS3File(userToken,fileMetadata)
    }

    @MessagePattern({cmd: 'updateNewS3Files'})
    @Roles('Admin','Receptionist','Lawyer')
    async updateFiles(@Payload() {userToken,fileId,fileMetadata}:s3UpdateFilePayloadDto){
        return await this.s3FileService.updateS3File(userToken,fileId,fileMetadata)
    }

    @MessagePattern({cmd: 'deleteFile'})
    @Roles('Admin')
    async deleteFile(@Payload() {fileId}:deletedFileDto){
        return await this.s3FileService.deleteS3File(fileId)
    }
}
