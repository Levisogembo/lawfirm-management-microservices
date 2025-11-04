import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class sendAutoPasswordDto{
    @IsNotEmpty()
    @IsEmail()
    to: string

    @IsNotEmpty()
    @IsString()
    password:string

    @IsNotEmpty()
    @IsString()
    verifyEmail: string
}

export class sendPasswordResetDto{
    @IsNotEmpty()
    @IsEmail()
    to: string

    @IsNotEmpty()
    @IsString()
    resetUrl: string
}

export class resendVerificationMailDto{
    @IsNotEmpty()
    @IsEmail()
    to: string

    @IsNotEmpty()
    @IsString()
    verifyUrl: string
}