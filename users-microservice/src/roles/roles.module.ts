import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../typeorm/entities/User';
import { Roles } from '../typeorm/entities/Roles';

@Module({
  imports: [TypeOrmModule.forFeature([User,Roles])],
  controllers: [RolesController],
  providers: [RolesService]
})
export class RolesModule {}
