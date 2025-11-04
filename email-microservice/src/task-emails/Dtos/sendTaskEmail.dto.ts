import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class sendTaskDetailsDto{
    @IsNotEmpty()
    @IsEmail()
    to: string

    @IsNotEmpty()
    @IsString()
    assignedBy: string

    @IsNotEmpty()
    @IsString()
    task: string
}