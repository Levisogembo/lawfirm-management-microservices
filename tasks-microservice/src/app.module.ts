import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './typeorm/entities/User';
import { Roles } from './typeorm/entities/Roles';
import { Tasks } from './typeorm/entities/Tasks';
import { TasksModule } from './tasks/tasks.module';
import { Clients } from './typeorm/entities/Clients';
import { Cases } from './typeorm/entities/Cases';
import { Files } from './typeorm/entities/Files';
import { Visitors } from './typeorm/entities/Visitors';
import { Appointments } from './typeorm/entities/Appointments';
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'TEST' ? '.env.test' : '.env'
     }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        port: configService.get<number>('DB_PORT'),
        host: configService.get<string>('DB_HOST'),
        database: configService.get<string>('DB_NAME') ,
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        entities: [Roles, User, Tasks, Clients, Cases, Files, Visitors, Appointments],
        synchronize: false,
      })
    }), TasksModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
