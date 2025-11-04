import { Controller, UseGuards, ValidationPipe } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { resendVerificationMailDto, sendAutoPasswordDto, sendPasswordResetDto } from './Dtos/sendAutoPassword.dto';

@Controller('emails')
@UseGuards(ValidationPipe)
export class EmailsController {
    constructor(private emailService: EmailsService){}

    @MessagePattern({cmd:"sendGeneratedPassword"})
    async sendTestEmail(@Payload() {to,password,verifyEmail}:sendAutoPasswordDto){
        console.log(to); 
       return await this.emailService.sendNewPasswordEmail(to,password,verifyEmail)
    }

    @MessagePattern({cmd:"sendPasswordResetMail"})
    async sendPasswordResetEmail(@Payload() {to,resetUrl}:sendPasswordResetDto){
        //console.log(to); 
       return await this.emailService.sendPasswordResetUrl(to,resetUrl)
    }

    @MessagePattern({cmd:"sendVerifiedEmail"})
    async sendVerificationEmail(@Payload() to:string){
        //console.log(to); 
       return await this.emailService.sendVerifiedEmailNotification(to)
    }

    @MessagePattern({cmd:"resendVerificationMail"})
    async resendVerificationEmail(@Payload() {to,verifyUrl}:resendVerificationMailDto){
        //console.log(to); 
       return await this.emailService.resendVerificationUrl(to,verifyUrl)
    }

}
