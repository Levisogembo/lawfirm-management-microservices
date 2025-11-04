
export class fileS3Dto {
    originalName: string
    mimeType: string
    size: string
    buffer: any
}

export class fileDetailsS3Dto {
    fileName: string
    fileType: string
    clientId: string
    caseId: string
    originalName?: string
    mimeType?: string
    size?: string
    s3Key?: string
    s3FileUrl?: string
}

export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}

export class s3UEligibilityPayloadDto {
    userToken: userTokenDto
    fileDetails: fileDetailsS3Dto
}

export class s3UploadPayloadDto {
    userToken: userTokenDto
    fileMetadata: fileDetailsS3Dto
}
