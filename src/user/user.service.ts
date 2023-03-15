import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./schemas/user.schema";
import { Model } from "mongoose";
import { signupUserDto } from "./dto/signup-user.dto";
import { loginUserDto } from "./dto/login-user.dto";
import { googleLoginDto } from "./dto/google-login.dto";
import { GeneralHelperService } from "../helper/index";
import { verifyOtpDto } from "./dto/verify-otp.dto";
import { Action } from "../helper/enum";
import * as bcrypt from "bcrypt";
import jwtDecode from "jwt-decode";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>
  ) { }

  public async signup(signupUserDto: signupUserDto) {
    const checkUserExist = await this.userModel.findOne({
      email: signupUserDto.email,
    });

    if (checkUserExist) {
      return { "emailExist": true };  
    }

    const registerData = new this.userModel();
    registerData.firstName = signupUserDto.firstName;
    registerData.lastName = signupUserDto.lastName;
    registerData.userName = signupUserDto.userName;
    registerData.email = signupUserDto.email;
    registerData.password = signupUserDto.password;
    registerData.dateOfBirth = signupUserDto.dateOfBirth;
    registerData.gender = signupUserDto.gender;
    registerData.save();
    return GeneralHelperService.generateAccessToken(registerData);
  }

  public async login(loginUserDto: loginUserDto) {
    const checkUserExist = await this.userModel.findOne({
      email: loginUserDto.email,
    });
    if (!checkUserExist) {
      return { "emailNotFound": true };
    }
    const isMatch = await bcrypt.compare(
      loginUserDto.password,
      checkUserExist.password
    );

    if (checkUserExist.email == loginUserDto.email && !isMatch) {
      return { "invalidCredential": true };
    }
    return GeneralHelperService.generateAccessToken(checkUserExist);
  }
  public async getUserById(id: string): Promise<any> {
    var filter = { _id: id };
    var user = await this.userModel.findOne(filter);
    return user;
  }

  public async getUserByPhoneNumber(phone: string): Promise<any> {
    var filter = { phone: phone };
    var user = await this.userModel.findOne(filter);
    return user;
  }

  public async verifyOtp(verifyOtpDto: verifyOtpDto) {
    const payload = GeneralHelperService.verifyJwt(verifyOtpDto.accessToken);
    if (!payload.isValid || payload.action !== Action.LOGIN) {
      return { "invalidToken": true };
    }
    const checkUser = await this.getUserByPhoneNumber(payload.sub);
    if (!checkUser) {
      return { "invalidToken": true };
    }
    if (!checkUser.otpDetails) {
      return { "invalidOtp": true };
    }
    var loginTime = GeneralHelperService.getCurrentTimeStampUnix();
    if (
      checkUser.otpDetails.otp != verifyOtpDto.otp ||
      checkUser.otpDetails.otpExpiredAt < loginTime
    ) {
      return { "invalidOtp": true };
    }
    checkUser.otpDetails = null;
    await checkUser.save();
    const result = {
      _id: checkUser._id,
      phone: checkUser.phone,
      accessToken: GeneralHelperService.generateAccessToken(checkUser),
    };
    return result;
  }

  public async googleLogin(googleLoginDto: googleLoginDto) {
    const decode: any = jwtDecode(googleLoginDto.token);
    if (decode.aud != process.env.GOOGLEID) {
      return { "invalidToken": true };
    }
    const user = await this.userModel.findOne({ email: decode.email });
    if (!user) {
      const createUser = new this.userModel({
        email: decode.email,
      });
      const result = await createUser.save();
      if (!result) {
        return { "userNotSave": true };
      }
      const token = GeneralHelperService.generateAccessToken(result);
      return { accessToken: token }
    }
    const token = GeneralHelperService.generateAccessToken(user);
    return { accessToken: token }
  }
}
