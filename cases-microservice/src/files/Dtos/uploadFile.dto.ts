
export class uploadFileDto {
    originalName: string
    fileName: string
    mimeType: string
    fileSize: string
    filePath: string
    fileType: string
    clientId: string
    caseId: string
}

export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}

export class fileUploadPayloadDto {
    userToken: userTokenDto
    fileMetadata: uploadFileDto
}
