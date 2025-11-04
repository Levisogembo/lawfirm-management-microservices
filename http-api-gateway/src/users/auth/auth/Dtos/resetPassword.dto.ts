import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator"


export class resetPasswordDto{
    @IsNotEmpty()
    @IsString()
    token: string

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
    confirmedPassword: string
}

export class resendVerificationEmailDto{
  @IsNotEmpty()
  @IsEmail()
  email: string
}