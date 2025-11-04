import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {PassportModule } from '@nestjs/passport'
import {JwtModule} from '@nestjs/jwt'
import { LocalStrategy } from './strategies/LocalStrategy';
import { NatsModule } from 'src/nats/nats.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {expiresIn: configService.get<number>('JWT_ExpiresIn')}
      })
  }),
  NatsModule
],
  controllers: [AuthController],
  providers: [AuthService,LocalStrategy]
})
export class AuthModule {}
