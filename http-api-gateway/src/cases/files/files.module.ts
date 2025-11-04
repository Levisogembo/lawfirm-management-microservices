import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { NatsModule } from 'src/nats/nats.module';
import { S3ClientModule } from 'src/s3-client-module/s3-client-module.module';

@Module({
  imports: [NatsModule, S3ClientModule],
  controllers: [FilesController]
})
export class FilesModule {}
