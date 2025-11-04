export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}

export class deletedFileDto{
    userToken: userTokenDto
    fileId: string
}