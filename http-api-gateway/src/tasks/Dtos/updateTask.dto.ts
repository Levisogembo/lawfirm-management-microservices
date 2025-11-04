import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { TaskPriorities, TaskStatus } from "./tasks.enums";
import { Type } from "class-transformer";

class NoteDto {
    @IsString()
    message: string;
}

export class updateTaskDto {
    @IsOptional()
    @IsEnum(TaskPriorities, { message: 'The task priority must be Low, Medium or High' })
    priority?: TaskPriorities

    @IsOptional()
    @IsEnum(TaskStatus, { message: 'The task priority must be Not started, In progress , stalled or Completed' })
    status?: TaskStatus

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NoteDto)
    notes?: NoteDto[];
}