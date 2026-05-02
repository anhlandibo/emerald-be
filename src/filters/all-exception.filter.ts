import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseDto } from 'src/dtos/response.dto';
interface PipeRespone {
  message: string[];
  error: string;
  stateCode: number;
}
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    console.log(exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const startTime = Number(request['startTime']);
    const endTime = Date.now();
    const takenTime = `${endTime - startTime}ms`;
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string;
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (exception instanceof BadRequestException) {
        const pipeResponse = exceptionResponse as PipeRespone;
        message = Array.isArray(pipeResponse.message)
          ? pipeResponse.message[0]
          : (pipeResponse.message as string);
      } else {
        // HttpException with string or object response
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || 'Internal server error';
      }
    } else {
      message = 'Internal server error';
    }

    response
      .status(status)
      .json(new ResponseDto(status, message, takenTime, request));
  }
}
