import { Body, Controller, Inject, Post, ConflictException, UseGuards, HttpException, Get, Param, ParseUUIDPipe, UsePipes, ValidationPipe, Delete, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { lastValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../auth/auth/guards/Jwt.guard';
import { createRoleDto } from '../Dtos/createRole.dto';

@Controller('roles')
export class RolesController {
    constructor(@Inject('Nats_messenger') private natsClient: ClientProxy) { }

    @Post('create')
    @UseGuards(JwtAuthGuard)
    async createRole(@Req() req:Request,@Body() roleData: createRoleDto) {
        try {
            const role = roleData.role
            const userToken = req.user
            let newRole = await lastValueFrom(this.natsClient.send({ cmd: 'createNewRole' }, {userToken, role}))
            //console.log(newRole);
            return newRole;
        } catch (error) {
            if (error?.message === 'Role already exists') {
                throw new ConflictException(error.message);
            }
            throw error;
        }
    }

    @Get('all')
    @UseGuards(JwtAuthGuard)
    async getAllRoles() {
        const foundRoles = await lastValueFrom(this.natsClient.send({ cmd: 'getAllRoles' }, ''))
        if (!foundRoles) throw new HttpException('No Roles Found', 404)
        return foundRoles
    }

    @Delete('delete/:id')
    @UseGuards(JwtAuthGuard)
    @UsePipes(ValidationPipe)
    async deleteRole(@Req() req: Request,@Param('id',ParseUUIDPipe) id: string){
        try {
            const userToken = req.user
            const role = await lastValueFrom(this.natsClient.send({cmd: 'getRoleById'},{userToken,id}))
            return {
                msg: 'Role deleted successfully',
                role
            }
        } catch (error) {
            if(error.message === 'Role not found'){
                throw new HttpException('Role not found',404)
            }
            throw error
        }
        
    }

}
