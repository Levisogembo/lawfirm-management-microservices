
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class sendCaseDetailsDto{
    @IsNotEmpty()
    @IsEmail()
    to: string

    @IsNotEmpty()
    @IsString()
    assignedBy: string

    @IsNotEmpty()
    @IsString()
    caseName: string
}