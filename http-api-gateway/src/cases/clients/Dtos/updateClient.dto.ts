import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator"

export class updateClientDto {

    @IsOptional()
    @IsString()
    @MaxLength(10)
    @MinLength(10)
    phoneNumber : string

    @IsOptional()
    @IsEmail()
    email: string
}