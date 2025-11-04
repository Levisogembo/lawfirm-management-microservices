import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {TypeOrmModule} from '@nestjs/typeorm'
import {ConfigModule, ConfigService} from '@nestjs/config'
import { Roles } from './typeorm/entities/Roles';
import { User } from './typeorm/entities/User';
import { Tasks } from './typeorm/entities/Tasks';
import { Clients } from './typeorm/entities/Clients';
import { Cases } from './typeorm/entities/Cases';
import { Files } from './typeorm/entities/Files';
import { Visitors } from './typeorm/entities/Visitors';
import { Appointments } from './typeorm/entities/Appointments';
import { ClientsModule } from './clients/clients.module';
import { CasesModule } from './cases/cases.module';
import { FilesModule } from './files/files.module';
import { S3ClientModuleModule } from './s3-client-module/s3-client-module.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true,
      envFilePath: process.env.NODE_ENV === 'TEST' ? '.env.test' : '.env'
    }),
    TypeOrmModule.forRootAsync({
      imports:[ConfigModule],
      inject: [ConfigService],
      useFactory : async (configService: ConfigService)=>({
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
    ClientsModule,
    CasesModule,
    FilesModule,
    S3ClientModuleModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
