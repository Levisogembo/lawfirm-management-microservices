import { IsEmail, IsOptional, IsString, Matches } from "class-validator";

export class updateProfileDto {
    @IsOptional()
    @IsEmail()
    email?: string

    @IsOptional()
    @IsString()
    username?:string

    @IsOptional()
    @Matches(/^\d{10}$/, {
        message: 'Phone number must be a 10-digit number',
      })
    phonenumber?: number
}