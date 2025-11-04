export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}

export class searchCaseByIdDto {
    userToken: userTokenDto
    caseId: string
}

export class searchCaseByNumberDto {
    userToken: userTokenDto
    caseNumber: string
}