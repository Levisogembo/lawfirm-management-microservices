import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3'
import { S3ClientService } from './s3-service/s3-service.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Files } from '../typeorm/entities/Files';
import { FilesS3ServiceService } from './files-s3-service/files.s3.service.service';
import { NatsModule } from '../nats/nats.module';
import { FilesS3ControllerController } from './files-s3-controller/files-s3-controller.controller';

@Module({
    imports: [ConfigModule,TypeOrmModule.forFeature([Files]),NatsModule],
    providers: [
        {
            provide: 'S3_CLIENT',
            inject: [ConfigService],
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
            
        },
        S3ClientService,
        FilesS3ServiceService     
    ],
    exports: [S3ClientService],
    controllers: [FilesS3ControllerController]
})
export class S3ClientModuleModule { }
