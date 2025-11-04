import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../typeorm/entities/User';
import { Roles } from '../typeorm/entities/Roles';
import { NatsModule } from '../nats/nats.module';
import {JwtModule} from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports:[ConfigModule],
      inject:[ConfigService],
      useFactory: async (configService: ConfigService) =>({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions:{expiresIn:configService.get<string>("JWT_ExpiresIn")}
      })
    }),
    NatsModule,
    TypeOrmModule.forFeature([User, Roles])
  ],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
