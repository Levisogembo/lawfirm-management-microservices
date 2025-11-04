import { IsArray, IsEnum, isNotEmpty, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { TaskPriorities, TaskStatus } from "./tasks.enums";
import { Type } from "class-transformer";

class NoteDto {
    @IsString()
    message: string;
}

export class createTaskDto {
    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsEnum(TaskPriorities,{message: 'The task priority must be Low, Medium or High'})
    priority: TaskPriorities

    @IsNotEmpty()
    @IsEnum(TaskStatus,{message: 'The task priority must be Not started, In progress , stalled or Completed'})
    status: TaskStatus

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NoteDto)
    notes?: NoteDto[];
}

export class assignTaskDto{
    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsEnum(TaskPriorities,{message: 'The task priority must be Low, Medium or High'})
    priority: TaskPriorities

    @IsNotEmpty()
    @IsEnum(TaskStatus,{message: 'The task priority must be Not started, In progress , stalled or Completed'})
    status: TaskStatus

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NoteDto)
    notes?: NoteDto[];

    @IsNotEmpty()
    @IsString()
    assignedTo: string
}