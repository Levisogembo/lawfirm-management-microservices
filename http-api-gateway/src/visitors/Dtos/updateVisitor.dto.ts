import { IsNotEmpty, IsOptional, IsString } from "class-validator"

export class updateVisitorDto{
    @IsOptional()
    @IsString()
    fullName?: string

    @IsOptional()
    @IsString()
    phoneNumber?: string

    @IsOptional()
    @IsString()
    purposeOfVisit?: string

    @IsOptional()
    @IsString()
    whoToSee?: string
}