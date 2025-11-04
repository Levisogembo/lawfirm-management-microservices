import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { NatsModule } from 'src/nats/nats.module';

@Module({
  imports: [NatsModule],
  controllers: [AppointmentsController]
})
export class AppointmentsModule {}
