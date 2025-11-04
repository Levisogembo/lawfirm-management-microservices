import { Body, Controller, Get, HttpException, HttpStatus, Inject, NotFoundException, Post, Query, Req, UnauthorizedException, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { LocalGuard } from './guards/LocalGuard';
import { Request } from 'express';
import { changePasswordDto, JwtTokenDto } from './Dtos/changePassword.dto';
import { JwtAuthGuard } from './guards/Jwt.guard';
import { lastValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { comparePasswords } from '../../../utils/bcrypt';
import { use } from 'passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { resendVerificationEmailDto, resetPasswordDto } from './Dtos/resetPassword.dto';

@Controller('auth')
export class AuthController {
    constructor(@Inject('Nats_messenger') private natsClient: ClientProxy, private jwtService: JwtService,
        private configService: ConfigService) { }

    @Post('login')
    @UseGuards(LocalGuard)
    login(@Req() req: Request) {
        return {
            msg: 'Login success',
            token: req.user
        }
    }

    @Post('change')
    @UseGuards(JwtAuthGuard)
    @UsePipes(ValidationPipe)
    async changePassword(@Req() req: Request, @Body() { currentPassword, newPassword, confirmPassword }: changePasswordDto) {
        const userToken = req.user as JwtTokenDto
        const userId = userToken.id
        //fetching the user object
        const findUser = await lastValueFrom(this.natsClient.send({ cmd: 'getEmployeeById' }, userId))
        if (!findUser) throw new NotFoundException()

        //extracting the hashed password from the db
        const { password } = findUser

        // //comparing the passwords
        const passwordMatch = await comparePasswords(currentPassword, password)
        if (!passwordMatch) throw new HttpException('Old Password does not match', 400)

        // //comparing the new passwords whether they match
        if (newPassword === confirmPassword) {
            const updatedPassword = await lastValueFrom(this.natsClient.send({ cmd: 'changedPassword' }, { userId, newPassword }))
            if (!updatedPassword) throw new NotFoundException()
            //return updatedPassword
            return {
                msg: 'Password changed successfully'
            }
        } else {
            throw new HttpException('New passwords do not match, please try again', 400)
        }

    }

    @Post('forgot-password')
    @UsePipes(ValidationPipe)
    async forgotPassword(@Body() email: string) {
        //check if email exists
        //console.log(email);
        const foundEmail = await lastValueFrom(this.natsClient.send({ cmd: 'findUserByEmail' }, email))
        const extractedEmail = foundEmail.email
        const extractedId = foundEmail.id
        const payload = { extractedId, extractedEmail }
        
        const generatedToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>("JWT_SECRET"),
            expiresIn: this.configService.get<string>("JWT_ExpiresIn")
        })
        //to be sent to the user's emai  
        const resetUrl = `http://localhost:3000/api/v1/auth/reset-password?token=${generatedToken}`

        //send the reset email to the user's email account
        const emailSent = await lastValueFrom(this.natsClient.send({ cmd: 'sendPasswordResetMail' }, { to: extractedEmail, resetUrl }))
        if (emailSent.status !== 'success') throw new HttpException(emailSent, HttpStatus.BAD_REQUEST)
        return { msg: `Reset password sent to ${extractedEmail}` }
    }

    @Post('reset-password')
    @UsePipes(ValidationPipe)
    async resetPassword(@Body() { token, newPassword, confirmedPassword }: resetPasswordDto) {
        //compare passwords if they match
        if (newPassword !== confirmedPassword) throw new HttpException("Passwords do not match", HttpStatus.BAD_REQUEST)

        //verify if the token is valid or not
        const isValidToken = await this.jwtService.verifyAsync(token)
        if (!isValidToken) throw new HttpException("Invalid or expire token", HttpStatus.UNAUTHORIZED)

        //extract userId from the token first
        const userId = isValidToken.extractedId
        if (!userId) throw new HttpException("Invalid token", HttpStatus.BAD_REQUEST)

        //send message to users microservice to update the password
        const updatedPassword = await lastValueFrom(this.natsClient.send({ cmd: 'changedPassword' }, { userId, newPassword }))
        if (!updatedPassword) throw new HttpException("Error resetting password", HttpStatus.INTERNAL_SERVER_ERROR)
        return { msg: 'Password reset successfully' }
    }

    @Get('verify')
    async verifyEmail(@Query('token') token: string) {
        //verify token if it is true
        const isValidToken = await this.jwtService.verifyAsync(token)
        if (!isValidToken) throw new HttpException("Invalid or expire token", HttpStatus.UNAUTHORIZED)

        const userEmail = isValidToken.userEmail
        const validateUser = await lastValueFrom(this.natsClient.send({ cmd: 'activateAccount' }, userEmail))
        return validateUser
    }

    @Post('resend-email')
    async resendVerificationEmail(@Body() email: resendVerificationEmailDto) {
        //if(!email) throw new HttpException("Email cannot be empty",HttpStatus.BAD_REQUEST)
        //console.log(email);
        const foundEmail = await lastValueFrom(this.natsClient.send({ cmd: 'findUserByEmail' }, email))
        const userEmail = foundEmail.email
        const id = foundEmail.id
        const payload = { id, userEmail }
        const generatedToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>("JWT_SECRET"),
            expiresIn: this.configService.get<string>("JWT_ExpiresIn")
        })
        //to be sent to the user's emai  
        const verifyUrl = `http://localhost:3000/api/v1/auth/verify?token=${generatedToken}`

        //send the reset email to the user's email account
        const emailSent = await lastValueFrom(this.natsClient.send({ cmd: 'resendVerificationMail' }, { to: userEmail, verifyUrl }))
        if (emailSent.status !== 'success') throw new HttpException(emailSent, HttpStatus.BAD_REQUEST)
        return { msg: `Reset password sent to ${userEmail}` }
    }
}
