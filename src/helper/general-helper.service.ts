import { Injectable } from "@nestjs/common";
import * as dayjs from "dayjs";
import jwt_decode from "jwt-decode";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "../user/schemas/user.schema";
import { Model } from "mongoose";
import * as jwt from "jsonwebtoken";
import { Action } from "./enum";
const LOGIN_TOKEN_EXPIRES_IN = 10 * 60 * 1000;
@Injectable()
export class GeneralHelperService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>
  ) { }
  static sendResponse(
    res: any,
    status: number,
    code: number,
    message: any,
    payload: any
  ) {
    return res.status(status).send(ApiResponse(code, message, payload));
  }

  static injectOtp() {
    const otpDetails = {
      otp: generateOneTimePassword(),
      otpCreatedAt: getCurrentTimeStampWithAdditionMinutes(0).valueOf(),
      otpExpiredAt: getCurrentTimeStampWithAdditionMinutes(3).valueOf(),
    };
    return otpDetails;
  }

  static parseAccessToken(req: any) {
    const auth = req.headers.authorization;
    const [type, token] = auth ? auth.split(" ") : [undefined, undefined];
    if (type === "Bearer") {
      return token;
    } else {
      const header = req.headers.authorization;
      return typeof header === "string" ? header : undefined;
    }
  }
  static getCurrentTimeStampUnix() {
    return dayjs().unix();
  }
  static verifyJwt(token: any) {
    try {
      const tokenData: any = jwt_decode(token);
      if (tokenData && this.getCurrentTimeStampUnix() > tokenData.exp) {
        return {
          isValid: false,
          reason: "expired",
        };
      } else if (tokenData && this.getCurrentTimeStampUnix() < tokenData.exp) {
        return {
          isValid: true,
          ...tokenData,
        };
      } else {
        return {
          isValid: false,
          reason: "invalid",
        };
      }
    } catch (err) {
      return {
        isValid: false,
        reason: "invalid",
      };
    }
  }
  static generateJwt(payload: any, expiresIn: any) {
    let token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: expiresIn,
      algorithm: "HS256",
    });

    return token;
  }
  static generateLoginToken(user: any) {
    return this.generateJwt({
      sub: user._id,
      action: Action.LOGIN
    }, LOGIN_TOKEN_EXPIRES_IN);
  }
  static generateAccessToken(user: any) {
    return this.generateJwt({
      sub: user.id,
      action: Action.ACCESS
    }, process.env.JWT_EXPIRY_TIME);
  }
  static async parsePagination(data: any) {
    const page = Number(data.page) > 0 ? Number(data.page) : 1
    const perPage = Number(data.perPage) > 0 ? Number(data.perPage) : 10

    return {
      skip: perPage * (page - 1),
      perPage,
      page,
    }
  }

  static paginateResponse(list: any, totalRecords: any, perPage: number, page: number) {
    return {
      list,
      perPage,
      page,
      totalRecords,
      totalPages: Math.ceil(totalRecords / perPage),
    }
  }
  static calculateDuration(duration: any) {
    var sec_num = parseInt(duration, 10)
    var hours = Math.floor(sec_num / 3600)
    var minutes = Math.floor(sec_num / 60) % 60
    var seconds = sec_num % 60

    return [hours, minutes, seconds]
      .map(v => v < 10 ? "0" + v : v)
      .filter((v, i) => v !== "00" || i > 0)
      .join(":")
  }
}
function ApiResponse(code: number, msg: string, data: any) {
  if (data != null || data != undefined) {
    return { code: code, message: msg, data: data };
  }
  return { code: code, message: msg };
}

function generateOneTimePassword() {
  return "12345";
}
function getCurrentTimeStampWithAdditionMinutes(minutes: number) {
  return dayjs().add(minutes, "minutes");
}

