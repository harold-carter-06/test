import { loginAdminDto, loginAdminSuccessResponse, loginAdminErrorResponse } from './dto/create-admin.dto';
import { GeneralHelperService, HttpExceptionFilter, Message, HttpStatus } from "../../common/index.service";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body, UseFilters, Res } from '@nestjs/common';
import { AdminService } from './admin.service';
const send = GeneralHelperService.sendResponse;
@ApiTags("Admin")
@Controller("admin")
@ApiBearerAuth("JWT")
@UseFilters(new HttpExceptionFilter())
@Controller('admin')

export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Post("login")
  @ApiOperation({ summary: "login" })
  @ApiResponse({ status: 200, type: loginAdminSuccessResponse })
  @ApiResponse({ status: 400, type: loginAdminErrorResponse })
  public async login(@Res() res: any, @Body() loginAdmin: loginAdminDto) {
    const user: any = await this.adminService.login(loginAdmin);
    return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, user);
  }
}
