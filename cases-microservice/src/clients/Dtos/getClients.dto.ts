export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}


export class getAllClientsDto{
    userToken: userTokenDto
    page: number
    limit: number
}