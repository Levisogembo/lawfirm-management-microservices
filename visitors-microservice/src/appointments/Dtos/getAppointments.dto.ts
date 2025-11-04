export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}


export class getAllAppointmentsDto{
    userToken: userTokenDto
    page: number
    limit: number
}