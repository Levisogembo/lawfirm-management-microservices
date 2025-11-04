import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { NatsModule } from 'src/nats/nats.module';

@Module({
  imports: [NatsModule],
  controllers: [RolesController],
  providers: [RolesService]
})
export class RolesModule {}
