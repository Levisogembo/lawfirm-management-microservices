import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { changedPasswordDto } from './Dtos/changePassword.dto';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
     //constructor(private authService:AuthService){}

    // @MessagePattern({cmd:'changedPassword'})
    // async changePassword(@Payload() userData:changedPasswordDto){
    //     const updatedPassword = await this.authService.updatePassword(userData)
    //     return updatedPassword
    // }
}
