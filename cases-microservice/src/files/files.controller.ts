import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { fileUploadPayloadDto, userTokenDto } from './Dtos/uploadFile.dto';
import { FilesService } from './files.service';
import { log } from 'node:console';
import { searchCriteriaPayloadDto, searchFileIdDto } from './Dtos/searchFile.dto';
import { updateFilePayloadDto } from './Dtos/updateFile.dto';
import { deletedFileDto } from './Dtos/deleteFile.dto';
import { getAllFilesDto } from './Dtos/getFiles.dto';

@Controller('files')
@UseGuards(RolesGuard)
export class FilesController {
    constructor(private fileService: FilesService){}

    @MessagePattern({cmd:'createNewFile'})
    @Roles('Admin','Receptionist','Lawyer')
    async uploadFile(@Payload() payload: fileUploadPayloadDto ){
        return await this.fileService.uploadNewFile(payload)
    }

    @MessagePattern({cmd:'searchAllFiles'})
    @Roles('Admin','Receptionist','Lawyer')
    async getAllFiles(@Payload() {page,limit}:getAllFilesDto){
        return await this.fileService.getAllFiles(page,limit)
    }

    @MessagePattern({cmd:'searchFileById'})
    @Roles('Admin','Receptionist','Lawyer')
    async getFileByID(@Payload() {fileId}: searchFileIdDto ){
        console.log(fileId);
        return await this.fileService.getFileById(fileId)
    }

    @MessagePattern({cmd:'searchFileCriteria'})
    @Roles('Admin','Receptionist','Lawyer')
    async searchFiles(@Payload() {searchCriteria}: searchCriteriaPayloadDto){
        return await this.fileService.searchFileCriteria(searchCriteria)
    }

    @MessagePattern({cmd:'updateFiles'})
    @Roles('Admin','Receptionist','Lawyer')
    async updateFile(@Payload() {userToken,id,fileMetadata}: updateFilePayloadDto){
        return await this.fileService.updateFileMetadata(userToken,id,fileMetadata)
    }

    @MessagePattern({cmd:'deleteDiskFile'})
    @Roles('Admin')
    async deleteLocalFile(@Payload() {fileId}: deletedFileDto){
        return await this.fileService.deleteLocalFile(fileId)
    }


}
