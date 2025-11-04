import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Unexpected error';

        // Case 1: HTTP exceptions (validation, forbidden, etc.)
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message = (res as any).message || (res as any).error || res;
        }

        // Case 2: RpcException thrown inside a microservice
        else if (exception instanceof RpcException) {
            const error = exception.getError();
            message = typeof error === 'string'
                ? error
                : error['message'] || JSON.stringify(error);
        }

        // Case 3: Plain object returned from NATS / gRPC
        else if (typeof exception === 'object') {
            message = exception['message'] || exception['error'] || message;
        }

        // Case 4: Native JS Error
        else if (exception instanceof Error) {
            message = exception.message;
        }

        //  Application-specific message → HTTP status mapping
        switch (message) {
            case 'Client not found':
            case 'Role does not exist':
            case 'Case not found':
            case 'User not found':
            case 'File not found':
            case 'Visitor not found':
            case 'Appointment not found':
            case 'Email not found':
            case 'Username not found':
                status = HttpStatus.NOT_FOUND;
                break;

            case 'Forbidden resource':
            case 'You cannot edit a case not assigned to you':
            case 'Case cannot be assigned to unauthorized roles':
                status = HttpStatus.FORBIDDEN;
                break;

            case 'No fields provided to update':
            case 'Case number already exists':
            case 'username already exists try another one':
            case 'email already exists try another one':
            case 'Email already exists!':
            case 'Task Name Already exists':
            case 'Filename already exists try another one':
            case 'No file details provided':
            case "Appointment end time can't be before today's date":
            case "Appointment start time can't be before today's date":
            case "Appointment end time can't be before or same time as start time":
            case "This appointment timeline conflicts with an existing one.":
            case "Failed to send email,try again":
                status = HttpStatus.CONFLICT;
                break;

            case 'Unauthorized':
                status = HttpStatus.UNAUTHORIZED;
                break;
        }

        response.status(status).json({
            statusCode: status,
            error: message,
            path: ctx.getRequest().url,
        });
    }
}
