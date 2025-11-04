import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { NatsModule } from 'src/nats/nats.module';
import { adminTasksController } from './tasks.admin.controller';

@Module({
  imports : [NatsModule],
  controllers: [TasksController,adminTasksController],
  providers: [TasksService]
})
export class TasksModule {}
