import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { Repository } from 'typeorm';
import { changedPasswordDto } from './Dtos/changePassword.dto';

@Injectable()
export class AuthService {
    constructor(@InjectRepository(User) private userRepository: Repository<User>){}

    async updatePassword({userId,password}: changedPasswordDto){
        const foundUser = await this.userRepository.findOne({where:{id:userId}})
        if(!foundUser) return null
        const user = await this.userRepository.update(userId,{password})
        return user
    }

}
