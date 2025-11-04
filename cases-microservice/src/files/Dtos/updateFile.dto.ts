
export class updateFileDto {
    diskName?: string
    originalName?: string
    fileName?: string
    mimeType?: string
    fileSize?: string
    filepath?: string
    fileType?: string
    Client?: string
    Case?: string
}

export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}

export class updateFilePayloadDto{
    userToken:userTokenDto
    id:string
    fileMetadata: updateFileDto
}