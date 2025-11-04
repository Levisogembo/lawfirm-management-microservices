import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3'
import { s3ClientService } from './s3.client.service';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'S3_CLIENT',
            useFactory: async (configService: ConfigService) => {
                //creating a new s3 connection
                return new S3Client({
                    region: configService.get<string>("AWS_REGION"),
                    credentials: {
                        accessKeyId: configService.get<string>("AWS_ACCESS_KEY_ID") ?? "",
                        secretAccessKey: configService.get<string>("AWS_SECRET_ACCESS_KEY") ?? ""
                    }
                })
            },
            inject: [ConfigService]
        }, s3ClientService],
    exports: [s3ClientService]
})
export class S3ClientModule { }
