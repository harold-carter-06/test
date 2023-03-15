import { HttpException } from "@nestjs/common"
import { HttpStatus } from "./code"

// export class RequestError extends Error {
//   constructor(status: any, code: number, msg: string, data: any) {
//     super(msg)
//     status = status
//     code = code
//     data = data
//   }
// }
// export class BadRequestError extends HttpException {

//   constructor(code: any, msg: string, data: any) {
//     // console.log( 'code', code );
//     // console.log( 'msg', msg );
//     // console.log( 'data', data );
//     super(HttpStatus.BAD_REQUEST, code)
//   }
// }

// async function createHttpExceptionBody(message: any, error: any, PRECONDITION_FAILED: any): string | Record<string, any> {
//   throw new Error("Function not implemented.")
// }
