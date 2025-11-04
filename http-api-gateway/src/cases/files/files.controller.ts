import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer';
import path, { extname } from 'path';
import { uploadFileDto } from './Dtos/uploadFile.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../users/auth/auth/guards/Jwt.guard';
import * as fs from 'fs'
import { searchCriteriaDto } from './Dtos/searchFiles.dto';
import { updateFileDto } from './Dtos/updateFile.dto';
import { ConfigService } from '@nestjs/config';
import { s3ClientService } from '../../s3-client-module/s3.client.service';

@Controller('files')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe)
export class FilesController {
    constructor(@Inject('Nats_messenger') private natsClient: ClientProxy, private configService: ConfigService,
        private s3ClientService: s3ClientService) { }

    //using multer to upload files to local storage and then sending metadata to cases microservice
    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './file-uploads', //file Path store locally
                filename: (req, file, callback) => {
                    //extract the filename from the form data
                    const createdFileName = req.body.fileName /*the fileName is the way you have defined the filename*/ || file.originalname

                    //creating unique filenames
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
                    const createdSuffix = extname(file.originalname)

                    // Build final filename
                    const finalName = `${createdFileName}-${uniqueSuffix}${createdSuffix}`;
                    callback(null, finalName)
                }
            })
        })
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File,
        @Body() fileDetails: uploadFileDto,
        @Req() req: Request
    ) {
        const userToken = req.user
        //create a metadata object for the file to be sent to the microservice and saved to db
        const fileMetadata = {
            originalName: file.originalname || file.filename,
            //fileName: file.filename,
            mimeType: file.mimetype,
            fileSize: file.size,
            filePath: file.path,
            ...fileDetails
        }
        try {
            const fileInfo = await lastValueFrom(this.natsClient.send({ cmd: 'createNewFile' }, { userToken, fileMetadata }))
            return { msg: 'File uploaded successfully', fileInfo }
        } catch (error) {
            // cleanup orphaned file
            //this setup writes to the disk storage but incase there is an error in writing the file to the db the file is removed
            await fs.promises.unlink(file.path).catch(() => { });
            throw error; // rethrow the error
        }

    }

    @Get()
    async getAllFiles(@Req() req: Request,@Query('page',ParseIntPipe) page:number,@Query('limit',ParseIntPipe) limit:number) {
        const userToken = req.user
        const allFiles = await lastValueFrom(this.natsClient.send({ cmd: 'searchAllFiles' }, { userToken, page,limit }))
        return allFiles.data.length ? { msg: 'success', allFiles } : {msg:"No files at the moment"}
    }

    @Get('file/:id')
    async getFileId(@Req() req: Request, @Param('id', ParseUUIDPipe) fileId: string) {
        const userToken = req.user
        const foundFile = await lastValueFrom(this.natsClient.send({ cmd: 'searchFileById' }, { userToken, fileId }))
        if (foundFile.length) return { msg: 'success', foundFile }
        throw new NotFoundException()
    }

    @Get('search')
    async searchFiles(
        @Query('client') client: string,
        @Query('casenum') casenum: string,
        @Query('filename') filename: string,
        @Req() req: Request
    ) {
        const userToken = req.user
        const searchCriteria: any = {}
        //pushing the values defined to the search criteria object
        if (client) searchCriteria.client = client
        if (casenum) searchCriteria.caseNumber = casenum
        if (filename) searchCriteria.filename = filename

        const searchedFile = await lastValueFrom(this.natsClient.send({ cmd: 'searchFileCriteria' }, { userToken, searchCriteria }))
        return { msg: 'success', hits: searchedFile.length, searchedFile }
    }

    @Patch('update/:id')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './file-uploads',
            filename: async (req, file, callback) => {
                //extract the filename from the form data
                const createdFileName = req.body.fileName /*the fileName is the way you have defined the filename*/ || file.originalname

                //creating unique filenames
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
                const createdSuffix = extname(file.originalname)

                // Build final filename
                const finalName = `${createdFileName}-${uniqueSuffix}${createdSuffix}`;
                callback(null, finalName)
            }
        })
    }))
    async updateFile(@UploadedFile() file: Express.Multer.File,
        @Req() req: Request, @Body() { fileName, ...fileUpdateDetails }: updateFileDto,
        @Param('id', ParseUUIDPipe) id: string) {
        const userToken = req.user

        //create a metadata object for the file to be sent to the microservice and saved to db
        let fileMetadata = {}
        //if file is uploaded by user created a metadata object with the file details
        if (file) {
            try {
                //check for the existing file and overwrite it with the new file details
                const existingFile = await lastValueFrom(this.natsClient.send({ cmd: 'searchFileById' }, { userToken, fileId: id }))
                const filepath = existingFile.map((item) => item.filepath)
                if (filepath) {
                    //unlink the old file and write the new one 
                    await fs.promises.unlink(filepath[0]).catch(() => {
                        console.warn(`Old file not found on disk: ${existingFile.filePath}`);
                    })
                }

            } catch (error) {
                throw error
            }
            //create new metadata object
            fileMetadata = {
                diskName: file.filename,//assign the multer filename to separate variable
                originalName: file.filename,//ensure that the filename remains user defined not the one for multer,
                fileName,//retain the original user-defined filename that will be used to update the filename in db
                mimeType: file.mimetype,
                fileSize: file.size,
                filepath: file.path,
                ...fileUpdateDetails
            }
        } else {
            fileMetadata = { ...fileUpdateDetails }
        }
        try {
            const updatedFile = await lastValueFrom(this.natsClient.send({ cmd: 'updateFiles' }, { userToken, id, fileMetadata }))
            return { msg: 'file updated successfully', updatedFile }
        } catch (error) {
            if (file) await fs.promises.unlink(file.path).catch(() => {
                console.log('error unlinking file');
            });
            throw error
        }

    }

    @Get('/:id/download')
    async downloadFile(@Req() req: Request, @Res() res: Response, @Param('id', ParseUUIDPipe) fileId: string) {
        const userToken = req.user
        //fetch the file
        const foundFile = await lastValueFrom(this.natsClient.send({ cmd: 'searchFileById' }, { userToken, fileId }))
        //console.log(foundFile)
        const file = Array.isArray(foundFile) ? foundFile[0] : foundFile; // <-- pick the first file
        const fileName =  file.fileName || 'downloaded-file';

        //console.log(file);

        //check if file is stored in s3 or in diskstorage
        const s3KeyPath: string = file.s3Key
        if (s3KeyPath) {
            const prefix = await this.configService.get<string>("S3_PREFIX")
            const filePath = `${prefix}/${s3KeyPath}`

            //make the download call to the s3 bucket
            const extractedFile = await this.s3ClientService.downloadFile(filePath)
            const contentType = extractedFile.ContentType
            // //set the response headers
            res.set({
                'Content-Type': contentType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            });


            (extractedFile.Body as NodeJS.ReadableStream).pipe(res)

        } else {
            //for files in local diskstorage
            const filePath = file.filepath;
            const contentType = file.mimeType
            res.set({
                'Content-Type': contentType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                // //return the download stream to the user

            });
            const downloadStream = fs.createReadStream(filePath)
            downloadStream.pipe(res)
        }

    }

    @Delete('delete/:id')
    async deleteLocalFile(@Param('id',ParseUUIDPipe) fileId:string,@Req() req: Request){
        //check for the existing file and overwrite it with the new file details
        const userToken = req.user
        const existingFile = await lastValueFrom(this.natsClient.send({ cmd: 'searchFileById' }, { userToken, fileId }))
        const file = Array.isArray(existingFile) ? existingFile[0] : existingFile
        const filePath = file.filepath

        //send command to delete filemetadata in the db
        await lastValueFrom(this.natsClient.send({cmd:'deleteDiskFile'},{userToken,fileId}))

        //unlink file from local storage after getting confirmation file metadata has been deleted in the db
        await fs.promises.unlink(filePath)
        return {msg:"File Deleted successfully"}
    }   
}
