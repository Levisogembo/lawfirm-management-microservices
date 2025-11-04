import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config'
import  {TypeOrmModule} from '@nestjs/typeorm'
import { Roles } from './typeorm/entities/Roles';
import { User } from './typeorm/entities/User';
import { Tasks } from './typeorm/entities/Tasks';
import { Clients } from './typeorm/entities/Clients';
import { Cases } from './typeorm/entities/Cases';
import { Files } from './typeorm/entities/Files';
import { Visitors } from './typeorm/entities/Visitors';
import { Appointments } from './typeorm/entities/Appointments';
import { VisitorsModule } from './visitors/visitors.module';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test'//override the config just for testing
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async(configService: ConfigService)=>({
        type: 'mysql',
        port: configService.get<number>('DB_PORT'),
        host: configService.get<string>('DB_HOST'),
        database: configService.get<string>('DB_NAME'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        entities: [Roles,User,Tasks,Clients, Cases, Files, Visitors, Appointments],
        synchronize: false
      })
    }),
    VisitorsModule,
    AppointmentsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
