import { Type } from "class-transformer";
import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator"

class NoteDto {
    @IsString()
    message: string;
}

export class createAppointmentDto{
    @IsNotEmpty()
    @IsString()
    title: string

    @IsNotEmpty()
    @IsDate()
    @Type(()=>Date)
    startTime: Date

    @IsNotEmpty()
    @IsDate()
    @Type(()=>Date)
    endTime: Date

    @IsNotEmpty()
    @IsString()
    location?: string

    @IsOptional()
    @IsArray()
    @ValidateNested({each:true})
    @Type(()=>NoteDto)
    notes: NoteDto[]

    @IsOptional()
    @IsString()
    client?: string

    @IsOptional()
    @IsString()
    case?: string

}