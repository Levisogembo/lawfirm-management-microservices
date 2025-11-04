import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { NatsModule } from 'src/nats/nats.module';

@Module({
  imports: [NatsModule],
  controllers: [ClientsController]
})
export class ClientsModule {}
