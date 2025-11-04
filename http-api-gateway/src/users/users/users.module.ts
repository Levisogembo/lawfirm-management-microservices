import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NatsModule } from 'src/nats/nats.module';
import { JwtAuthGuard } from '../auth/auth/guards/Jwt.guard';
import { JwtStrategy } from '../auth/auth/strategies/JwtStrategy';

@Module({
  imports: [NatsModule],
  controllers: [UsersController],
  providers: [UsersService,JwtStrategy]
})
export class UsersModule {}
