import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength, Matches } from 'class-validator'
import { Exclude } from 'class-transformer'

export class createUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsNotEmpty()
  @IsString()
  username: string

  @IsNotEmpty()
  @IsString()
  fullname: string


  // @IsNotEmpty()
  // @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
  //   message: 'Password must contain at least 8 characters, including letters and numbers',
  // })
  // password: string;

  @IsNotEmpty()
  @IsString()
  roleId: string

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must be a 10-digit number',
  })
  phonenumber: string;
}

export class excludePassword{

  @Exclude()
  password:string
}