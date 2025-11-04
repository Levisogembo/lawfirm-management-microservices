import { Type } from "class-transformer";
import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator"

class NoteDto {
    @IsString()
    message: string;
}

export class updateAppointmentDto{
    @IsOptional()
    @IsString()
    title: string

    @IsOptional()
    @IsDate()
    @Type(()=>Date)
    startTime?: Date

    @IsOptional()
    @IsDate()
    @Type(()=>Date)
    endTime?: Date

    @IsOptional()
    @IsString()
    location?: string

    @IsOptional()
    @IsArray()
    @ValidateNested({each:true})
    @Type(()=>NoteDto)
    notes?: NoteDto[]

    @IsOptional()
    @IsString()
    client?: string

    @IsOptional()
    @IsString()
    case?: string

}