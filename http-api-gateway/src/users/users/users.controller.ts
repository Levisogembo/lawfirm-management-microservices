import {
    Body, Controller, Get, Inject, NotFoundException, Param,
    ConflictException, ParseUUIDPipe, Patch, Post, Req, UseGuards,
    UsePipes, ValidationPipe,
    Delete,
    UnauthorizedException,
    Query,
    ParseIntPipe,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { createUserDto, excludePassword } from './Dtos/createUser.dto';
import { lastValueFrom } from 'rxjs';
import { plainToClass } from 'class-transformer';
import { JwtAuthGuard } from '../auth/auth/guards/Jwt.guard';
import { use } from 'passport';
import { Request } from 'express';
import { updateProfileDto } from './Dtos/updateUser.dto';
import { log } from 'node:console';

@Controller('users')
export class UsersController {
    constructor(@Inject('Nats_messenger') private natsClient: ClientProxy) { }

    @Post('create')
    @UseGuards(JwtAuthGuard)//ensuring user must be logged in with a valid token
    @UsePipes(ValidationPipe)
    async createNewUser(@Req() req: Request, @Body() userInfo: createUserDto) {
        const userToken = req.user
        let value = await lastValueFrom(this.natsClient.send({ cmd: 'createUser' }, { userToken, userInfo }))
        return [{
            msg: 'User Created Successfully',
            user: plainToClass(excludePassword, value)
        }]
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getUsers(@Req() req: Request,@Query('page',ParseIntPipe) page:number,@Query('limit',ParseIntPipe) limit:number) {
        const userToken = req.user
        const response = await lastValueFrom(this.natsClient.send({ cmd: 'getUsers' }, { userToken, page, limit }))        
        if (!response.users.length) return { msg: 'No users found' }
        const data = response.users.map((user) => plainToClass(excludePassword, user))
        return [{ msg: 'success',total:data.length,page,data }]
    }

    @Get('username')
    async getByUserName(username: string) {
        const foundUser = await lastValueFrom(this.natsClient.send({ cmd: 'getByUsername' }, username))
        return foundUser
    }

    @Get('employee/:id')
    @UseGuards(JwtAuthGuard)
    @UsePipes(ValidationPipe)
    async getById(@Param('id', ParseUUIDPipe) id: string) {
        const foundUser = await lastValueFrom(this.natsClient.send({ cmd: 'getEmployeeById' }, id))
        if (!foundUser) throw new NotFoundException()
        return { msg: 'success', data: plainToClass(excludePassword, foundUser) }
    }

    @Patch('update')
    @UseGuards(JwtAuthGuard)
    @UsePipes(ValidationPipe)
    async updateProfile(@Req() req: Request, @Body() profileInfo: updateProfileDto) {
        try {
            const userDetails = req.user
            const updatedProfile = await lastValueFrom(this.natsClient.send({ cmd: 'updateUserProfile' }, { userDetails, profileInfo }))

            return { msg: 'success', data: plainToClass(excludePassword, updatedProfile) }
        } catch (error) {
            // Handle custom RPC error from microservice
            if (error?.message === 'username already exists try another one') {
                throw new ConflictException(error.message); // returns 409
            }
            if (error?.message === 'email already exists try another one') {
                throw new ConflictException(error.message); // returns 409
            }
        }

    }

    @Delete('delete/:id')
    @UseGuards(JwtAuthGuard)
    async deleteUser(@Req() req: Request, @Param('id', ParseUUIDPipe) userId: string) {
        const userToken = req.user
        const deletedUser = await lastValueFrom(this.natsClient.send({ cmd: 'deleteUser' }, { userToken, userId }))
        if (!deletedUser) throw new NotFoundException()
        return {
            msg: 'User Deleted Successfully',
        }
    }




}
