import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Files } from '../typeorm/entities/Files';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [TypeOrmModule.forFeature([Files]),NatsModule],
  controllers: [FilesController],
  providers: [FilesService]
})
export class FilesModule {}
