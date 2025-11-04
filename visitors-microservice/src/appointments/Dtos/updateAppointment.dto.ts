
class NoteDto {
    message: string;
}

export class updateAppointmentDto{
    title?: string
    startTime?: Date
    endTime?: Date
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

export class updateAppointmentDetailsPayloadDto{
    userToken: userTokenDto
    appointmentId: string
    appointmentDetails: updateAppointmentDto
}

export class deleteAppointmentDetailsPayloadDto{
    userToken: userTokenDto
    appointmentId: string
}