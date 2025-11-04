
export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}

export class clientDetailsDto {
    clientName: string
    email: string
    phoneNumber: string
}

export class CreateClientPayloadDto {
    userToken: userTokenDto
    clientDetails: clientDetailsDto
}

export class ClientIdDto {
    userToken: userTokenDto
    id: string
}