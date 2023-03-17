import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';
import { requestManager } from '../request-manager/request-manager';
import { Roles } from '../roles.decorator';
import {
  AuthCredentialsDto,
  AuthCredentialsDtoForGoogle,
  changePasswordDTO,
  SignUpDto,
  SignUpDtoWithGoogle,
  StaffUserResposne,
} from './dto/all-dto';
import { GetUser } from './get-user.decorator';
import { User } from './models/user.model';
import { UserService } from './user.service';

@Controller(requestManager.user.controllerPath)
export class UserController {
  constructor(private userService: UserService) {}

  @Post(requestManager.user.methods.signUp.path)
  async signUp(@Body(ValidationPipe) signUpCredDTO: SignUpDto) {
    return await this.userService.signUp(signUpCredDTO);
  }

  @Post(requestManager.user.methods.signIn.path)
  async signIn(
    @Body(ValidationPipe) authCredetialDto: AuthCredentialsDto,
  ): Promise<void> {
    console.log('signed in called');
    return await this.userService.signIn(authCredetialDto);
  }

  @Post(requestManager.user.methods.signUpWithGoogle.path)
  async signUpWithGoogle(
    @Body(ValidationPipe) signUpCredDTO: SignUpDtoWithGoogle,
  ) {
    return await this.userService.signUpWithGoogle(signUpCredDTO);
  }

  @Post(requestManager.user.methods.signInWithGoogle.path)
  async signInWithGoogle(
    @Body(ValidationPipe) authCredetialDto: AuthCredentialsDtoForGoogle,
  ): Promise<void> {
    console.log('signed in called with google');
    return await this.userService.signInUserWithGoogle(authCredetialDto);
  }
  @Get(requestManager.user.methods.signInForSuperAdmin.path)
  async signInForSuperAdmin(
    @Query('token') token: string,
    @Query('email') email: string,
  ): Promise<string> {
    return await this.userService.signInForAdmin(email, token);
  }

  @Get(requestManager.user.methods.resetPasswordLink.path)
  async getResetPasswordLink(@Query('email') email: string): Promise<string> {
    return await this.userService.sendResetPasswordLink(email);
  }
  @Post(requestManager.user.methods.changePasswordWithLink.path)
  async changePasswordWithLink(
    @Body('code') code: string,
    @Body('new_password') new_password: string,
  ): Promise<string> {
    return await this.userService.changePasswordWithLink(code, new_password);
  }

  @Get(requestManager.user.methods.requestVerifyDomainDuringSignUp.path)
  async requestDomainVerification(
    @Query('domain') domain: string,
  ): Promise<string> {
    return await this.userService.requestVerifyDomainDuringSignup(domain);
  }
  @Get(requestManager.user.methods.requestVerifyPhoneDuringSignUp.path)
  async requestPhoneVerification(
    @Query('phone') phone: string,
  ): Promise<string> {
    return await this.userService.requestVerifyPhoneDuringSignup(phone);
  }

  @Post(requestManager.user.methods.verifyEmailLink.path)
  async verifyEmailLink(@Body('code') code: string): Promise<string> {
    return await this.userService.verifyEmailLink(code);
  }

  @Get(requestManager.user.methods.getPresignedURL.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.user.methods.getPresignedURL.roles)
  async getPresignedURL(
    @GetUser() user: User,
    @Query('filename') filename: string,
    @Query('filetype') filetype: string,
  ): Promise<any> {
    return await this.userService.getPreSignedUploadURL(
      user,
      filename,
      filetype,
    );
  }

  @Get(requestManager.user.methods.getStaffUsers.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.user.methods.getStaffUsers.roles)
  async getStaffUsersFor(@GetUser() user: User): Promise<StaffUserResposne[]> {
    return await this.userService.getStaffUsers(user);
  }

  @Post(requestManager.user.methods.changePassword.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.user.methods.changePassword.roles)
  async changePassword(
    @GetUser() user: User,
    @Body(ValidationPipe) changePasswordData: changePasswordDTO,
  ): Promise<User> {
    return await this.userService.changePassword(user, changePasswordData);
  }

  @Post(requestManager.user.methods.sendCustomEmailDomainVerification.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.user.methods.sendCustomEmailDomainVerification.roles)
  async sendCustomEmailTemplates(
    @GetUser() user: User,
    @Body('custom_email') custom_email: string,
  ): Promise<string> {
    return await this.userService.sendCustomSESVerificationEmail(
      user,
      custom_email,
    );
  }

  @Get(requestManager.user.methods.verifyUserToken.path)
  @UseGuards(AuthGuard(['main-jwt-strategy', 'api-key-strategy']), RolesGuard)
  @Roles(requestManager.user.methods.verifyUserToken.roles)
  async verifyRole(@GetUser() user: User): Promise<User> {
    return user;
  }

  @Get(requestManager.user.methods.getProfileInfo.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.user.methods.getProfileInfo.roles)
  async getProfileInfo(@GetUser() user: User): Promise<User> {
    return user;
  }

  @Patch(requestManager.user.methods.updateProfileInfo.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.user.methods.updateProfileInfo.roles)
  async updateUserInfo(@GetUser() user: User, @Body() body: any) {
    return await this.userService.updateUserInfo(user, body);
  }

  @Get(requestManager.user.methods.sendEmailVerificationLink.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.user.methods.sendEmailVerificationLink.roles)
  async verifyEmail(@GetUser() user: User): Promise<string> {
    return await this.userService.sendVerificationEmailLink(user.email);
  }

  @Post(requestManager.user.methods.updateOnboardingComplete.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.user.methods.updateOnboardingComplete.roles)
  async completeOnboarding(@GetUser() user: User): Promise<string> {
    return await this.userService.updateOnboardingComplete(user);
  }
}
