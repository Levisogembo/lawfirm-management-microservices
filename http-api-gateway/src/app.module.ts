import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NatsModule } from './nats/nats.module';
import { UsersModule } from './users/users/users.module';
import { RolesModule } from './users/roles/roles/roles.module';
import { PermissionsModule } from './users/permissions/permissions/permissions.module';
import { AuthModule } from './users/auth/auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule } from './cases/clients/clients.module';
import { CaseController } from './cases/case/case.controller';
import { CaseModule } from './cases/case/case.module';
import { FilesModule } from './cases/files/files.module';
import { S3FilingModule } from './cases/s3-filing/s3-filing.module';
import { VisitorsModule } from './visitors/visitors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import {ThrottlerGuard, ThrottlerModule} from '@nestjs/throttler'
import {APP_GUARD} from '@nestjs/core'

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 300000, //5 minutes
        limit: 100 //requests every 5 minutes 
      }
    ]),//api rate limiting
    ConfigModule.forRoot({ isGlobal: true }), NatsModule, UsersModule,
    RolesModule, PermissionsModule,
    AuthModule, TasksModule,
    ClientsModule, CaseModule, FilesModule, S3FilingModule, VisitorsModule, AppointmentsModule
  ],
  controllers: [],
  providers: [{
    provide: APP_GUARD,
    useClass: ThrottlerGuard
  }],
})
export class AppModule { }
