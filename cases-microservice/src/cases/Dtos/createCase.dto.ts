
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

export class getMyUpcomingHearingsDto{
    userToken: userTokenDto
}

export class caseDetailsDto {
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
}

export class createCasePayloadDto {
    userToken: userTokenDto
    caseDetails: caseDetailsDto
}