import { Module } from '@nestjs/common';
import { NatsModule } from 'src/nats/nats.module';
import { CaseController } from './case.controller';
import { adminCaseController } from './case.admin.controller';

@Module({
    imports: [NatsModule],
    controllers: [CaseController,adminCaseController]
})
export class CaseModule {}
