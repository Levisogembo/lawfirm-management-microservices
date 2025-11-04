export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}

export class deleteVisitorDto{
    userToken: userTokenDto
    visitorId: string
}