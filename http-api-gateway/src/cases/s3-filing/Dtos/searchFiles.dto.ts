import { IsOptional, IsString } from "class-validator";

export class searchCriteriaDto {
    @IsOptional()
    @IsString()
    client: string

    @IsOptional()
    @IsString()
    caseNumber: string

    @IsOptional()
    @IsString()
    filename: string
}