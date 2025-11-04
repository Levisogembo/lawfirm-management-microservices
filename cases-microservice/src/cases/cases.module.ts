import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cases } from '../typeorm/entities/Cases';
import { NatsModule } from '../nats/nats.module';
import { adminCaseController } from './cases.admin.controller';
import { adminCaseService } from './case.admin.service';

@Module({
  imports: [NatsModule,TypeOrmModule.forFeature([Cases])],
  providers: [CasesService,adminCaseService],
  controllers: [CasesController,adminCaseController]
})
export class CasesModule {}
