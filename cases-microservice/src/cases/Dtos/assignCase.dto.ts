
import { caseStatus } from "./enums/caseStatus.enum";
class NoteDto {
    message: string;
}

export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}

export class assignCaseDetailsDto {
    caseTitle: string
    caseNumber: string
    caseType: string
    caseStatus: caseStatus
    hearingDate?: Date
    assignedJudge: string
    plaintiffs?: string
    defendants?: string
    caseNotes?: NoteDto[]
    client: string
    assignTo: string
}

export class assignCasePayloadDto {
    userToken: userTokenDto
    assignCaseDetails: assignCaseDetailsDto
}

export class reAssignedDto {
    caseId:string
    assignTo:string
}

export class reAssignCasePayloadDto {
    userToken: userTokenDto
    caseDetails: reAssignedDto
}