import { IsArray, IsDate, IsEnum, isNotEmpty, IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { caseStatus } from "./enums/caseStatus.enum";
import { Transform, Type } from "class-transformer";

class NoteDto {
    @IsString()
    message: string;
}

export class createCaseDto {
    @IsNotEmpty()
    @IsString()
    caseTitle: string

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    caseNumber: string

    @IsNotEmpty()
    @IsString()
    caseType: string

    @IsNotEmpty()
    @IsEnum(caseStatus,{message:'Case status must be either PreTrial, Trial, Pending Documents, Appeal, Closed'})
    caseStatus: caseStatus

    @IsOptional()
    @IsDate()
    @Type(()=>Date)
    //transform the received date into a Date instance //2025-08-22
    @Transform(({ value }) => {
        if (!value) return null;
        const date = new Date(value);
      
        // Normalize to local date (strip timezone shift)
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      })
    hearingDate?: Date

    @IsNotEmpty()
    @IsString()
    assignedJudge: string

    @IsOptional()
    @IsString()
    plaintiffs?: string

    @IsOptional()
    @IsString()
    defendants?: string

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NoteDto)
    caseNotes?: NoteDto[]

    @IsNotEmpty()
    @IsString()
    client: string
}