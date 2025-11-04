import { Controller } from '@nestjs/common';
import { AuthService, } from './auth.service';
import { MessagePattern,  Payload } from '@nestjs/microservices';
import { changedPasswordDto } from './Dtos/changePassword.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService){}
    @MessagePattern({cmd:'changedPassword'})
    async changePassword(@Payload() userData: changedPasswordDto){
        //console.log(userData);
        
        const updatedPassword = await this.authService.updatePassword(userData)
        return updatedPassword
    }

    @MessagePattern({cmd:'activateAccount'})
    async verifyEmail(@Payload() userEmail: string){
        //console.log(userData);
        const verified = await this.authService.verifyEmail(userEmail)
        return verified
    }
}
