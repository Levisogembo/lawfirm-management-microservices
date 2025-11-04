
export class updateFileDto {
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

export class s3UpdateFilePayloadDto{
    userToken:userTokenDto
    fileId:string
    fileMetadata: updateFileDto
}