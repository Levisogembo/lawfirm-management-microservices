import { IsArray, IsDate, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { caseStatus } from "./enums/caseStatus.enum"
import { Transform, Type } from "class-transformer";

class NoteDto {
    message: string;
}

export class updateCaseDetailsDto {
    @IsOptional()
    @IsString()
    caseTitle?: string

    @IsOptional()
    @IsString()
    caseType?: string

    @IsOptional()
    @IsEnum(caseStatus,{message:'Case status must be either PreTrial, Trial, PendindDocuments, Appeal, Closed'})
    caseStatus?: caseStatus

    @IsOptional()
    @IsDate()
    @Type(()=>Date)
    //transform the received date into a Date instance //2025-08-22T00:00:00.000Z
    @Transform(({ value }) => {
        if (!value) return null;
        const date = new Date(value);
      
        // Normalize to local date (strip timezone shift)
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      })
    hearingDate?: Date

    @IsOptional()
    @IsString()
    assignedJudge?: string

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

    @IsOptional()
    @IsString()
    client?: string
}