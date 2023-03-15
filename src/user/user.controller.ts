import {
  Controller,
  Post,
  Body,
  Res,
  BadRequestException,
  UseFilters,
} from "@nestjs/common";
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  signupUserDto,
  signupUserErrorResponse,
  signupUserSuccessResponse,
} from "./dto/signup-user.dto";
import {
  loginUserDto,
  loginUserSuccessResponse,
  loginUserErrorResponse,
} from "./dto/login-user.dto";
import { UserService } from "./user.service";
import {
  GeneralHelperService,
  HttpExceptionFilter,
  Message,
  HttpStatus,
  ErrorCode,
} from "../common/index.service";
import {
  verifyOtpDto,
  verifyOtpSuccessResponse,
  verifyOtpErrorResponse,
} from "./dto/verify-otp.dto";
import {
  googleLoginErrorResponse,
  googleLoginSuccessResponse,
  googleLoginDto,
} from "./dto/google-login.dto";

const send = GeneralHelperService.sendResponse;
@ApiTags("user")
@Controller("user")
@ApiBearerAuth("JWT")
@UseFilters(new HttpExceptionFilter())
export class UserController {
  constructor(private readonly usersService: UserService) { }
  @Post("singup")
  @ApiOperation({ summary: "Signup new user" })
  @ApiResponse({ status: 200, type: signupUserSuccessResponse })
  @ApiResponse({ status: 400, type: signupUserErrorResponse })
  public async signup(@Res() res: any, @Body() signupUser: signupUserDto) {
    const user: any = await this.usersService.signup(signupUser);
    if (user.emailExist) {
      throw new BadRequestException(
        HttpStatus.BAD_REQUEST,
        Message.EMAIL_ALREADY_EXIST
      );
    }
    if (user) {
      return send(
        res,
        HttpStatus.SUCCESS,
        HttpStatus.SUCCESS,
        Message.SUCCESS,
        user
      );
    }
    throw new BadRequestException(
      HttpStatus.BAD_REQUEST,
      Message.SOMETHING_WENT_WRONG
    );
  }

  @Post("login")
  @ApiOperation({ summary: "login" })
  @ApiResponse({ status: 200, type: loginUserSuccessResponse })
  @ApiResponse({ status: 400, type: loginUserErrorResponse })
  public async login(@Res() res: any, @Body() loginUser: loginUserDto) {
    const user: any = await this.usersService.login(loginUser);
    if (user.emailNotFound) {
      throw new BadRequestException(
        HttpStatus.BAD_REQUEST,
        Message.EMAIL_NOT_FOUND
      );
    }
    if (user.invalidCredential) {
      throw new BadRequestException(
        HttpStatus.BAD_REQUEST,
        Message.INVALID_CREDENTIAL
      );
    }
    return send(
      res,
      HttpStatus.SUCCESS,
      HttpStatus.SUCCESS,
      Message.SUCCESS,
      user
    );
  }

  @Post("verify/otp")
  @ApiOperation({ summary: "verify otp" })
  @ApiResponse({ status: 200, type: verifyOtpSuccessResponse })
  @ApiResponse({ status: 400, type: verifyOtpErrorResponse })
  public async verifyOtp(@Res() res: any, @Body() verifyOtp: verifyOtpDto) {
    const user: any = await this.usersService.verifyOtp(verifyOtp);
    if (user.invalidToken) {
      throw new BadRequestException(
        ErrorCode.INVALID_TOKEN_CODE,
        Message.TOKEN_INVALID
      );
    } else if (user.invalidOtp) {
      throw new BadRequestException(ErrorCode.INVALID_OTP, Message.INVALID_OTP);
    } else if (user) {
      return send(
        res,
        HttpStatus.SUCCESS,
        HttpStatus.SUCCESS,
        Message.SUCCESS,
        user
      );
    }
  }

  @Post("google/login")
  @ApiOperation({ summary: "google login" })
  @ApiResponse({ status: 200, type: googleLoginSuccessResponse })
  @ApiResponse({ status: 400, type: googleLoginErrorResponse })
  public async googleLogin(
    @Res() res: any,
    @Body() googleLoginDto: googleLoginDto
  ) {
    const user: any = await this.usersService.googleLogin(googleLoginDto);
    console.log('user', user);
    console.log('data', user.invalidToken);
    if (user.invalidToken) {
      throw new BadRequestException(
        ErrorCode.INVALID_TOKEN_CODE,
        Message.TOKEN_INVALID
      );
    }
    if (user.userNotSave) {
      throw new BadRequestException(
        HttpStatus.BAD_REQUEST,
        Message.SOMETHING_WENT_WRONG,
      )
    }
    return send(
      res,
      HttpStatus.SUCCESS,
      HttpStatus.SUCCESS,
      Message.SUCCESS,
      user
    );
  }
}
