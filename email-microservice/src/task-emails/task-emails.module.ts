import { Module } from '@nestjs/common';
import { TaskEmailsController } from './task-emails.controller';
import { TaskEmailsService } from './task-emails.service';

@Module({
  controllers: [TaskEmailsController],
  providers: [TaskEmailsService]
})
export class TaskEmailsModule {}
