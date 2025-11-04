import { IsOptional, IsString } from "class-validator"

export class updateFileDto {
    @IsOptional()
    @IsString()
    Client?: string

    @IsOptional()
    @IsString()
    Case?: string

    @IsOptional()
    @IsString()
    fileName?: string

    @IsOptional()
    @IsString()
    fileType?: string
}