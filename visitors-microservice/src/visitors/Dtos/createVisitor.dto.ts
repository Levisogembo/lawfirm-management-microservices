
export class createVisitorDto{
    fullName: string
    phoneNumber: string
    purposeOfVisit: string
    whoToSee?: string
}


export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}

export class createVisitorPayloadDto{
    userToken: userTokenDto
    visitorDetails: createVisitorDto
}