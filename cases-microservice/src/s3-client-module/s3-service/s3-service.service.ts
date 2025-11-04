import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {} from 'multer'
import {Upload} from '@aws-sdk/lib-storage'
import { Readable } from 'stream';

@Injectable()
export class S3ClientService {
    private bucketName: string

    constructor(@Inject('S3_CLIENT') private s3Client: S3Client,
        private readonly configService: ConfigService
    ) {this.bucketName = configService.get<string>("S3_BUCKET") ?? ""}

    async uploadFileS3(file: Express.Multer.File, Key: string){
        //upload the s3 file using the aws/lib-storage
        const fileUpload = new Upload({
            client: this.s3Client,
            params:{
                Bucket: this.bucketName,
                Key: Key || file.filename,
                Body: file.buffer,
                ContentType: file.mimetype
            }
        })

        await fileUpload.done()
        return `http://${this.bucketName}.s3.${this.configService.get<string>("AWS_REGION")}.amazon.com/${file.filename}`
    }

    //downloading the file from s3
    async getFileStream(Key:string){
        const objectCommand = new GetObjectCommand({
            Bucket: this.bucketName,
            Key  
        })

        const response = await this.s3Client.send(objectCommand)
        return response.Body as Readable
    }

    async deleteFile(Key:string){
        const deleteCommand = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key
        })

        await this.s3Client.send(deleteCommand)
    }

}
