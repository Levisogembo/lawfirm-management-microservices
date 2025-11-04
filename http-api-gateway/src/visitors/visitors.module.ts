import { Module } from '@nestjs/common';
import { VisitorsController } from './visitors.controller';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [NatsModule],
  controllers: [VisitorsController]
})
export class VisitorsModule {}
