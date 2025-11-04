import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailsModule } from './emails/emails.module';
import {ConfigModule} from '@nestjs/config'
import { TaskEmailsModule } from './task-emails/task-emails.module';
import { CaseEmailsService } from './case-emails/case-emails.service';
import { CaseEmailsController } from './case-emails/case-emails.controller';
import { CaseEmailsModule } from './case-emails/case-emails.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal:true}),
    EmailsModule,
    TaskEmailsModule,
    CaseEmailsModule
  ],
  controllers: [AppController, CaseEmailsController],
  providers: [AppService, CaseEmailsService],
})
export class AppModule {}
