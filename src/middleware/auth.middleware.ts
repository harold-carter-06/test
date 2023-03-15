import { Injectable, NestMiddleware } from "@nestjs/common";
import { GeneralHelperService } from "../helper/index";
import { HttpStatus, ErrorCode } from "../error/code";
import { Message } from "src/helper/localization";
import { UserService } from "src/user/user.service";
const send = GeneralHelperService.sendResponse;
import { Action } from "../helper/enum";
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(req: any, res: any, next: (error?: any) => void) {
    try {
      console.log("req.path", req.path);
      const accessToken = GeneralHelperService.parseAccessToken(req);
      if (accessToken === undefined) {
        return send(
          res,
          HttpStatus.BAD_REQUEST,
          ErrorCode.REQUIRED_CODE,
          Message.TOKEN_REQUIRED,
          null
        );
      }

      const token = GeneralHelperService.verifyJwt(accessToken);
      if (!token.isValid) {
        return send(
          res,
          HttpStatus.UNAUTHORIZED,
          ErrorCode.INVALID_CODE,
          Message.TOKEN_INVALID,
          null
        );
      }
      if (
        token.action == Action.LOGIN &&
        req.path != "user/verify/otp" &&
        req.path != "/resend/otp"
      ) {
        return send(
          res,
          HttpStatus.UNAUTHORIZED,
          ErrorCode.INVALID_CODE,
          Message.TOKEN_INVALID,
          null
        );
      }
      const user = await this.userService.getUserById(token.sub);
      if (!user) {
        return send(
          res,
          HttpStatus.UNAUTHORIZED,
          ErrorCode.INVALID_CODE,
          Message.TOKEN_INVALID,
          null
        );
      }

      req.authUser = user;
      return next();
    } catch (error) {
      next(error);
    }
  }
}
