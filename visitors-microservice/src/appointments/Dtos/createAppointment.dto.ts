
class NoteDto {
    message: string;
}

export class createAppointmentDto{
    title: string
    startTime: Date
    endTime: Date
    location?: string
    notes?: NoteDto[]
    client?: string
    case?: string

}


export class userTokenDto {
    id: string;
    username: string;
    role: string;
    iat: string;
    exp: string
}

export class createAppointmentPayloadDto{
    userToken: userTokenDto
    appointmentDetails: createAppointmentDto
}

export class getAppointmentByIdDto{
    userToken: userTokenDto
    appointmentId: string
}

export class getAppointmentByTitleDto{
    userToken: userTokenDto
    title: string
}