import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
//import { changedPasswordDto } from 'src/sample/Dtos/changePassword.dto';
import { User } from '../typeorm/entities/User';
import { Repository } from 'typeorm';
import { changedPasswordDto } from './Dtos/changePassword.dto';
import { hashPassword } from '../utils/bcrypt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
    constructor(@InjectRepository(User) private userRepository: Repository<User>,
    @Inject('Nats_messenger') private natsClient: ClientProxy){}

    async updatePassword({userId,newPassword}:changedPasswordDto){
       const foundUser = await this.userRepository.findOne({where:{id:userId}})
        if(!foundUser) return null
        const password = await hashPassword(newPassword)
        const obj = {password}
        const user = await this.userRepository.update(userId,obj)
        return user
    }

    async verifyEmail(userEmail:string){
        //find user
        const foundUser = await this.userRepository.findOne({where:{email:userEmail}})
        if(!foundUser) throw new RpcException("User not found")
        
        //update the user's account to be verified
        await this.userRepository.update({email:userEmail},{isVerified:true})
        console.log(foundUser.email);
        
        //send notification to email service to send email that account is now verified
        const isEmailSent = await lastValueFrom(this.natsClient.send({cmd:'sendVerifiedEmail'},foundUser.email))
        if(isEmailSent.status !== 'success') throw new RpcException("Failed to send email,try again")
        return {msg:'Email verified successfully'}
    }
}
