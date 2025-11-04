import { FindOperator } from "typeorm";


export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}

export class searchFileIdDto {
    userToken: userTokenDto
    fileId: string
}


export class searchCriteriaDto {
    client?: string
    caseNumber?: string
    filename?: string
}

export class searchCriteriaPayloadDto {
    userToken: userTokenDto
    searchCriteria: searchCriteriaDto
}

//to be used in the where search for typeorm
export class combinedSearchObjectDto {
    fileName?: string | FindOperator<string>
    Client?: {clientName: string | FindOperator<string>}
    Case?: {caseNumber: string | FindOperator<string>}
}
