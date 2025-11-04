
export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}

export class updateDetailsDto {
    phoneNumber?: string

    email?: string
}

export class updateClientDto {
    userToken: userTokenDto
    clientDetails: updateDetailsDto
    id: string
}

export class deleteClientDto {
    userToken: userTokenDto
    id: string
}