import { Module } from '@nestjs/common';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visitors } from '../typeorm/entities/Visitors';

@Module({
  imports: [TypeOrmModule.forFeature([Visitors])],
 controllers: [VisitorsController],
  providers: [VisitorsService]
})
export class VisitorsModule {}
