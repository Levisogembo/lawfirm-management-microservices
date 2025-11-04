import { Module } from '@nestjs/common';
import { S3FilingController } from './s3-filing.controller';
import { S3ClientModule } from 'src/s3-client-module/s3-client-module.module';
import { NatsModule } from 'src/nats/nats.module';

@Module({
  imports:[S3ClientModule,NatsModule],
  controllers: [S3FilingController]
})
export class S3FilingModule {}
