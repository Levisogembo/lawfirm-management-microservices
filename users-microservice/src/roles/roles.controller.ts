import { Controller, UseGuards } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { RolesService } from './roles.service';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { createRoleDto } from './Dtos/createRole.dto';
import { deleteRoleDto } from './Dtos/deleteRole.dto';

@Controller('roles')
export class RolesController {
    constructor(private rolesService: RolesService) { }
    @MessagePattern({cmd: 'createNewRole'})
    @Roles('Admin')
    @UseGuards(RolesGuard)
    async createNewRole(@Payload() {role}: createRoleDto) {
        const newRole = await this.rolesService.createRole(role)
        return newRole
    }

    @MessagePattern({cmd: 'getAllRoles'})
    async getRoles(){
       return await this.rolesService.getRoles()
    }

    @Roles('Admin')
    @UseGuards(RolesGuard)
    @MessagePattern({cmd: 'getRoleById'})
    async deleteRole(@Payload() {id}: deleteRoleDto){
        return await this.rolesService.deleteRole(id)
    }

}
