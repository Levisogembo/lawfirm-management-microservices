import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../typeorm/entities/User';
import { Repository } from 'typeorm';
import { createUserDto } from './Dtos/createUserDto';
import { hashPassword } from '../utils/bcrypt';
import { updateProfileDto } from './Dtos/updateProfile.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Roles } from '../typeorm/entities/Roles';
import { generateRandomPassword } from '../utils/password-generator';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class UsersService {
    constructor(@InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Roles) private rolesRepository: Repository<Roles>,
        @Inject('Nats_messenger') private natsClient: ClientProxy,
        private jwtService: JwtService, private configService: ConfigService) { }

    async createNewUser({ roleId, ...userDetails }: createUserDto) {
        //auto generate password each time a new user is created

        const { email, username } = userDetails

        //validationg a unique username
        if (username) {
            const foundUsername = await this.findUsername(username)
            if (foundUsername) throw new RpcException('username already exists try another one')
        }

        //validationg a unique email
        if (email) {
            const foundEmail = await this.userRepository.findOne({where:{email}})
            if (foundEmail) throw new RpcException('email already exists try another one')
        }

        //checking if role exists

        if (roleId) {
            const password = await generateRandomPassword()
            // console.log(password);
            const bcryptPassword = await hashPassword(password)
            let foundRole = await this.rolesRepository.findOne({ where: { id: roleId } })
            if (!foundRole) throw new RpcException('Role does not exist')
            const newUser = await this.userRepository.create({
                ...userDetails,
                password: bcryptPassword,
                createdAt: new Date(),
                role: foundRole
            })

            //create a verify email to be sent to the user's email with a jwt token
            const payload = {userEmail:newUser.email}
            const token = await this.jwtService.signAsync(payload,{
                secret: this.configService.get<string>("JWT_SECRET"),
                expiresIn: '24h',       
            })

            const verifyEmail = `http://localhost:3000/api/v1/auth/verify?token=${token}`
            //send event to the email microservice to send email to the user with their created password
            const emailSent = await lastValueFrom(this.natsClient.send({ cmd: 'sendGeneratedPassword' }, { to: newUser.email, password, verifyEmail }))
            if (!emailSent || emailSent.status !== 'success') throw new RpcException("Failed to send email,try again")

            //save user only when email has been sent
            const createdUser = await this.userRepository.save(newUser)
            return createdUser
        }
        return null

    }

    async findAllUsers(page:number,limit:number) {
        const offset = (page - 1) * limit
        const [users,total] = await this.userRepository.findAndCount({
            order: {createdAt:'DESC'},
            skip: offset,
            take: limit
        })
        return {
            users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total/limit)
        }
    }

    async findUsername(username: string) {
        const user = await this.userRepository.findOne({ where: { username }, relations: ['role'] })
        if (!user) return null
        return user
    }

    async findEmail(email: string) {
        const user = await this.userRepository.findOne({ where: { email } })
        if (!user) throw new RpcException("Email not found")
        return user
    }


    async findUserById(id: string) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['role']
        })
        if (!user) return null
        return user
    }

    async updateProfile(profileInfo: updateProfileDto, userId: string) {
        const user = await this.findUserById(userId)
        if (!user) throw new RpcException('user not found')

        const { email, username, phonenumber } = profileInfo
        if (username) {
            const foundUsername = await this.findUsername(username)
            if (foundUsername) throw new RpcException('username already exists try another one')


        }
        if (email) {
            const foundEmail = await this.findEmail(email)
            if (foundEmail) throw new RpcException('email already exists try another one')
        }


        // Build clean update object without undefined values
        const updatePayload = Object.fromEntries(
            Object.entries({ email, username, phonenumber }).filter(([_, v]) => v !== undefined)
        );


        if (Object.keys(updatePayload).length === 0) {
            throw new RpcException('No fields provided to update');
        }

        await this.userRepository.update(userId, updatePayload);

        // Optionally return updated user
        return await this.findUserById(userId);
    }

    async deleteUser(id: string) {
        const user = await this.findUserById(id)
        if (!user) return null
        return await this.userRepository.delete(id)
    }

}
