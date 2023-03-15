import { GeneralHelperService, Message, HttpStatus } from '../../common/index.service'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { loginAdminDto, } from './dto/create-admin.dto';
import { Admin } from './schemas/admin.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<Admin>
  ) { }

  public async login(loginUserDto: loginAdminDto) {
    const checkUserExist = await this.adminModel.findOne({
      email: loginUserDto.email,
    });

    if (!checkUserExist) {
      throw new NotFoundException(HttpStatus.BAD_REQUEST, Message.EMAIL_NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(
      loginUserDto.password,
      checkUserExist.password
    );

    if (checkUserExist.email == loginUserDto.email && !isMatch) {
      throw new BadRequestException(HttpStatus.BAD_REQUEST, Message.INVALID_CREDENTIAL);
    }

    return GeneralHelperService.generateAccessToken(checkUserExist);
  }
}
