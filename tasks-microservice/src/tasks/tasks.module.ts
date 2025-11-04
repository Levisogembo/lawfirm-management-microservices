import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tasks } from '../typeorm/entities/Tasks';
import { NatsModule } from '../nats/nats.module';
import { adminTasksController } from './tasks.admin.controller';
import { adminTaskService } from './tasks.admin.service';

@Module({
  imports: [
    NatsModule,
    TypeOrmModule.forFeature([Tasks])
  ],
  controllers: [TasksController,adminTasksController],
  providers: [TasksService,adminTaskService]
})
export class TasksModule {}
