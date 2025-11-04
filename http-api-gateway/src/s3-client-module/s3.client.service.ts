import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Inject, Injectable } from "@nestjs/common";
import {Upload} from '@aws-sdk/lib-storage'
import { ConfigService } from "@nestjs/config";

@Injectable()
export class s3ClientService {
    private bucketName: string
    constructor(@Inject('S3_CLIENT') private s3Client: S3Client,private configService: ConfigService){
        this.bucketName = configService.get<string>("S3_BUCKET") ?? ""
    }

    async uploadFile(file: Express.Multer.File,Key:string){
        //get the prefix from the env which has the folder to store the file in
        const prefix =  this.configService.get<string>("S3_PREFIX")
        const finalKeyName = prefix ? `${prefix}/${Key}` : Key //the final object key in s3  
        const fileUpload = new Upload({
            client: this.s3Client,
            params:{
                Bucket: this.bucketName,
                Key: finalKeyName,
                Body: file.buffer,
                ContentType: file.mimetype,
                ServerSideEncryption: this.configService.get<string>("S3_SSE")?.toUpperCase() === "SSE-S3" ? "AES256" : undefined
            }
        })

        await fileUpload.done()
        return `http://${this.bucketName}.s3.${this.configService.get<string>("AWS_REGION")}.amazon.com/${file.originalname}`
    }

    async deleteFile(Key:string){
        const deleteCommand = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key
        })
        await this.s3Client.send(deleteCommand)
        return {msg:'File deleted successfully'}
    }

    async downloadFile(Key:string){
        const downloadCommand =  new GetObjectCommand({
            Bucket: this.bucketName,
            Key
        })

       return await this.s3Client.send(downloadCommand)
    }


}