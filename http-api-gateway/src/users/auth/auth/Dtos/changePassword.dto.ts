import { IsNotEmpty, IsString, Matches } from "class-validator";


export class changePasswordDto{
    @IsNotEmpty()
    @IsString()
    currentPassword:string

    @IsNotEmpty()
    @IsString()
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
        message: 'Password must contain at least 8 characters, including letters and numbers',
      })
    newPassword: string

    @IsNotEmpty()
    @IsString()
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
        message: 'Password must contain at least 8 characters, including letters and numbers',
      })
    confirmPassword: string
}

export class JwtTokenDto{
  id:string
  username:string
  role:string
}