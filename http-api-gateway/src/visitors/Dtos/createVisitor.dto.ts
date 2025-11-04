import { IsNotEmpty, IsOptional, IsString } from "class-validator"

export class createVisitorDto{
    @IsNotEmpty()
    @IsString()
    fullName: string

    @IsNotEmpty()
    @IsString()
    phoneNumber: string

    @IsNotEmpty()
    @IsString()
    purposeOfVisit: string

    @IsOptional()
    @IsString()
    whoToSee?: string
}