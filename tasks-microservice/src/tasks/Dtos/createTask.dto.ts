
import { TaskPriorities, TaskStatus } from "./tasks.enums";

export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
  }

 export class payloadDto {
    userToken: userTokenDto
    taskDetails: createTaskDto
 } 

export class createTaskDto {
    name: string
    priority: TaskPriorities
    status: TaskStatus
    notes?: string[]
}

export class assignNewDto {
    name: string
    priority: TaskPriorities
    status: TaskStatus
    notes?: string[]
    assignedTo: string
}

export class assignTaskDto {
    userToken: userTokenDto
    taskDetails: assignNewDto
}