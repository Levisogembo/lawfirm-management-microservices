
class NoteDto {
    message: string;
  }

  export class profileDto {
    priority?:string
    status?:string
    notes?:NoteDto[]
  }

export class updatedTaskDto {
    taskId: string
    payload: profileDto
}