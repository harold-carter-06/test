import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';

@Catch(HttpException, BadRequestException,InternalServerErrorException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const responseStatus = exception.getStatus();
    const stack = [exception]
    var code: any;
    var message: any;
    code = stack[0]['response']['message']
    message = stack[0]['response']['error']
    if (typeof stack[0]['response']['message'] == "object") {
      code = stack[0]['response']['statusCode']
      message = stack[0]['response']['message'][0]
    }
    response.status(responseStatus).json({
      code,
      message
    });
  }
}