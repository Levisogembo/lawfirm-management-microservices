import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class createNewClientDto {
    @IsNotEmpty()
    @IsString()
    clientName: string

    @IsNotEmpty()
    @IsEmail()
    email: string

    @IsNotEmpty()
    @IsString()
    @MinLength(10,{message:'Phone number must be 10 digits only'})
    @MaxLength(10,{message:'Phone number must be 10 digits only'})
    phoneNumber: string
}