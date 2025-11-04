import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class uploadFileDto {
    @IsNotEmpty()
    @IsString()
    fileName: string

    @IsNotEmpty()
    @IsString()
    fileType: string

    @IsOptional()
    @IsString()
    clientId: string

    @IsOptional()
    @IsString()
    caseId: string
}