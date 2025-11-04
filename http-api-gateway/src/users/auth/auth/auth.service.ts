import { HttpException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { comparePasswords } from '../../../utils/bcrypt';

@Injectable()
export class AuthService {
    constructor(@Inject('Nats_messenger') private natsClient: ClientProxy, private jwtService: JwtService) { }

    async validateUser(username: string, password: string) {
        const findUser = await lastValueFrom(this.natsClient.send({ cmd: 'findUsername' }, username))
        if (!findUser) throw new NotFoundException()
        const isValidPassword = await comparePasswords(password, findUser.password)
        if (!isValidPassword) {
            throw new UnauthorizedException()
        } else {
            
            const { id, username, role, isVerified } = findUser
            //check first if user has verified their email or not
           
            if(!isVerified) throw new UnauthorizedException("Your account is not verified please verify and try again")
            // const foundRole = role.name
            // if(!foundRole) throw new HttpException('Role not found',404)
            return await this.jwtService.signAsync({ id, username, role: role.role, isVerified })
        }

    }
}
