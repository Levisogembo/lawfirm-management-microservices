import { Controller, Post, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { createUserDto, CreateUserPayload, deleteUserDto } from './Dtos/createUserDto';
import { updateProfileDto } from './Dtos/updateProfile.dto';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('users')
export class UsersController {
    constructor(private userService: UsersService) { }

    @MessagePattern({ cmd: 'createUser' })
    @Roles('Admin')
    @UseGuards(RolesGuard)
    async createNewUser(@Payload() userDetails: CreateUserPayload) {
        const {userToken,userInfo} = userDetails
        const createduser = await this.userService.createNewUser(userInfo)
        return createduser
    }

    @Roles('Admin','Lawyer')
    @UseGuards(RolesGuard)
    @MessagePattern({ cmd: 'getUsers' })
    async getAllUsers(@Payload() {page,limit}) {
        const users = await this.userService.findAllUsers(page,limit)
        return users
    }

    @MessagePattern({ cmd: 'findUsername' })
    async findUser(@Payload() username: string) {
        const user = await this.userService.findUsername(username)
        return user
    }

    @MessagePattern({ cmd: 'getEmployeeById' })
    async findUserById(@Payload() id: string) {
        const user = await this.userService.findUserById(id)
        return user
    }

    @MessagePattern({ cmd: 'findUserByEmail' })
    async findEmail(@Payload() email: {email:string}) {
        const user = await this.userService.findEmail(email.email)
        return user
    }

    @MessagePattern({ cmd: 'updateUserProfile' })
    async updateProfile(@Payload() profileInfo) {
        if (!profileInfo?.userDetails) {
            throw new RpcException('userDetails is missing in payload');
        }
        const userId = profileInfo.userDetails.id
        const profileDetails: updateProfileDto = profileInfo.profileInfo
        const updatedProfile = await this.userService.updateProfile(profileDetails, userId)
        return updatedProfile
    }

    @Roles('Admin')
    @UseGuards(RolesGuard)
    @MessagePattern({cmd: 'deleteUser'})
    async deleteUser(@Payload() {userId,...Payload}: deleteUserDto){
        return await this.userService.deleteUser(userId)
    }

    // @MessagePattern({cmd: 'updateUserRole'})
    // async updateUserRole(@Payload() payload: {userId: string, roleId: string}){
    //     return await this.userService.updateUserRole(payload.userId, payload.roleId)
    // }

}
