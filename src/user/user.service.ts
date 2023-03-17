import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { S3 } from 'aws-sdk';
import * as awsSDK from 'aws-sdk';
import * as bcrypt from 'bcryptjs';
import * as deepEmailValidator from 'deep-email-validator';
import moment from 'moment';
import { Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { google, Auth } from 'googleapis';

import { sendEmailDto } from '../email-notification/email-notification.dto';
import { EmailNotificationService } from '../email-notification/email-notification.service';
import { RoleTypes } from '../roles.decorator';
import { TextNotificationService } from '../text-notification/text-notification.service';
import {
  AuthCredentialsDto,
  AuthCredentialsDtoForGoogle,
  changePasswordDTO,
  PublicUserInfoData,
  SignUpDto,
  SignUpDtoWithGoogle,
  StaffSignUpDto,
  StaffUserResposne,
} from './dto/all-dto';
import { jwtPayload } from './jwt-payload.interface';
import { AddressInfo, User } from './models/user.model';

import { isEmail } from 'class-validator';
import {
  CalendarColorOptions,
  CommonSettings,
  EstimateSettings,
  InvoiceSettings,
  businessHours,
} from 'src/common-settings/common-settings.model';
import { generateEmailVerificationText } from '../email-templates/email-verification';
import { VerifyUserEmail } from './models/email-verify.model';
import { NewUserSignupEvent } from './events/new-user-signup.event';
import { UserEventsType } from './dto/events.enum';
import { UserSignedInEvent } from './events/user-signed-in.event';
import { randomUUID } from 'crypto';
import { queueManager } from 'src/queue-manager/queue-manager';
import { createNewEmployeeEmailNotificationType } from 'src/employee/events/create-new-employee-email-notification.event';
import { ResetPasswordForUser } from './models/reset-password.model';
import { generateResetEmailText } from 'src/email-templates/reset-password-email';
import { sendEmailNotificationGeneralType } from 'src/email-notification/events/send-email-notification-general.event';
import { SqsService } from 'src/sqs-custom-module';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('Users') private userModel: Model<User>,
    @InjectModel('VerifyUserEmail')
    private verifyUserEmailModel: Model<VerifyUserEmail>,
    @InjectModel('CommonSettings')
    private commonSettingsModel: Model<CommonSettings>,
    @InjectModel('ResetPasswordUser')
    private resetUserPasswordModel: Model<ResetPasswordForUser>,

    private jwtService: JwtService,
    private emailNotificationService: EmailNotificationService,
    private textNotificationService: TextNotificationService,
    private readonly sqsService: SqsService,
  ) {}

  async signUp(signupCredDTO: SignUpDto): Promise<void> {
    const { email, password, firstName, lastName, timezone } = signupCredDTO;
    const domain = await this.getUniqueDomain();

    const findUser = await this.userModel.find({
      domain: domain,
    });
    if (findUser.length > 0) {
      throw new ConflictException(`Domain already exists`);
    }

    try {
      const verifyEmail = await deepEmailValidator.validate({
        validateSMTP: false,
        email: email,
      });
      if (!verifyEmail.valid) {
        throw new UnprocessableEntityException('Invalid email');
      }
    } catch (err) {
      throw new UnprocessableEntityException('Invalid email');
    }

    const user = new this.userModel();
    user.email = email;
    user.salt = await bcrypt.genSalt();
    user.mobile_verified = false;
    user.email_verified = false;
    user.firstName = firstName;
    user.lastName = lastName;
    user.domain = `${domain}`;
    user.onboardingCompleted = false;
    user.main_account_owner = true;
    user.timezone = timezone;
    user.roles = [RoleTypes.ADMIN];
    user.sign_in_provider = 'local';
    user.password = await this.hashPassword(password, user.salt);
    try {
      const newUser = await user.save();

      await this.sendVerificationEmailLink(user.email);
      const newUserSignUpEvent: NewUserSignupEvent = {
        createdAt: newUser.created_at_timestamp,
        domain: newUser.domain,
        email: newUser.email,
        userId: newUser._id,
      };

      const sendToQueue = await this.sqsService.send(
        `${queueManager.user.createNewUserAdminNotification.queueName}`,
        {
          id: `${randomUUID()}`,
          body: newUserSignUpEvent,
        },
      );
      console.log('queue message sent');
    } catch (err) {
      console.log(err);
      if ((err.code = '11000')) {
        throw new ConflictException('user already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
  async updateOnboardingComplete(loggedInUser: User) {
    const findUser = await this.userModel.findOne({
      email: loggedInUser.email,
      domain: loggedInUser.domain,
    });
    if (!findUser) {
      throw new NotFoundException(`User not found`);
    }
    try {
      findUser.onboardingCompleted = true;
      await findUser.save();
      return 'ok';
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        `something went wrong while onboarding.`,
      );
    }
  }

  async updateUserInfo(
    loggedInUser: User,
    body: {
      experienceLevel: string;
      addressInfo: AddressInfo;
      industry: string;

      user_profile_logo: string;
      firstName: string;
      lastName: string;
      companyName: string;
      companyLogo: string;
      taxRate: string;
      companyPhone: string;
      companyEmail: string;
      currency: string;
      eventStringFormat: string;
      calendarOptions: CalendarColorOptions[];
      timezone: string;
      invoiceSettings: InvoiceSettings;
      estimateSettings: EstimateSettings;
      google_business_link: string;
      companySize: string;
      stayOrganize: string[];
      is_product_service: boolean;
      businessHours: businessHours[];
      is_business_hours: boolean;
      facebook_url: string;
      instagram_url: string;
      twitter_url: string;
      yelp_url: string;
      angie_member_url: string;
    },
  ): Promise<string> {
    const findUser = await this.userModel.findOne({
      email: loggedInUser.email,
      domain: loggedInUser.domain,
    });
    if (!findUser) {
      throw new NotFoundException(`User not found`);
    }
    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: loggedInUser.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException(`Settings not found`);
    }

    try {
      const {
        experienceLevel,
        addressInfo,
        currency,
        user_profile_logo,
        firstName,
        lastName,
        companyEmail,
        companyLogo,
        companyName,
        companyPhone,
        taxRate,
        calendarOptions,
        eventStringFormat,
        timezone,
        industry,
        invoiceSettings,
        estimateSettings,
        google_business_link,
        companySize,
        stayOrganize,
        is_product_service,
        businessHours,
        is_business_hours,
        facebook_url,
        instagram_url,
        twitter_url,
        yelp_url,
        angie_member_url,
      } = body;

      findCommonSettings.addressInfo = addressInfo
        ? addressInfo
        : findCommonSettings.addressInfo;
      findCommonSettings.taxRate = taxRate
        ? taxRate
        : findCommonSettings.taxRate;
      findCommonSettings.companySettings.companyName = companyName
        ? companyName
        : findCommonSettings.companySettings.companyName;

      findCommonSettings.currency = currency
        ? currency
        : findCommonSettings.currency;
      findCommonSettings.calendarColors = calendarOptions
        ? calendarOptions
        : findCommonSettings.calendarColors;
      findCommonSettings.calendarBookingEventStringFormat = eventStringFormat
        ? eventStringFormat
        : findCommonSettings.calendarBookingEventStringFormat;

      findCommonSettings.google_business_link = google_business_link
        ? google_business_link
        : findCommonSettings.google_business_link;

      findCommonSettings.invoiceSettings = invoiceSettings
        ? invoiceSettings
        : findCommonSettings.invoiceSettings;
      findCommonSettings.estimateSettings = estimateSettings
        ? estimateSettings
        : findCommonSettings.estimateSettings;

      findCommonSettings.companySettings.companyLogo = companyLogo
        ? companyLogo
        : findCommonSettings.companySettings.companyLogo;
      findCommonSettings.companySettings.companyEmail = companyEmail
        ? companyEmail
        : findCommonSettings.companySettings.companyEmail;
      findCommonSettings.companySettings.companyPhone = companyPhone
        ? companyPhone
        : findCommonSettings.companySettings.companyPhone;

      findCommonSettings.companySettings.companySize = companySize
        ? companySize
        : findCommonSettings.companySettings.companySize;

      findCommonSettings.stayOrganize = stayOrganize
        ? stayOrganize
        : findCommonSettings.stayOrganize;

      findCommonSettings.is_product_service =
        is_product_service == true ? true : false;

      findCommonSettings.businessHours = businessHours
        ? businessHours
        : findCommonSettings.businessHours;

      findCommonSettings.is_business_hours = is_business_hours
        ? is_business_hours
        : findCommonSettings.is_business_hours;

      findCommonSettings.facebook_url = facebook_url
        ? facebook_url
        : findCommonSettings.facebook_url;

      findCommonSettings.instagram_url = instagram_url
        ? instagram_url
        : findCommonSettings.instagram_url;

      findCommonSettings.twitter_url = twitter_url
        ? twitter_url
        : findCommonSettings.twitter_url;

      findCommonSettings.yelp_url = yelp_url
        ? yelp_url
        : findCommonSettings.yelp_url;

      findCommonSettings.angie_member_url = angie_member_url
        ? angie_member_url
        : findCommonSettings.angie_member_url;

      findUser.firstName = firstName ? firstName : findUser.firstName;
      findUser.lastName = lastName ? lastName : findUser.lastName;
      findUser.user_profile_logo = user_profile_logo
        ? user_profile_logo
        : findUser.user_profile_logo;
      findUser.experienceLevel = experienceLevel
        ? experienceLevel
        : findUser.experienceLevel;
      findUser.industry = industry ? industry : findUser.industry;

      findUser.timezone = timezone ? timezone : findUser.timezone;
      findCommonSettings.markModified('addressInfo');
      findCommonSettings.markModified('companySettings');
      await findUser.save();
      await findCommonSettings.save();
      return 'ok';
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        `something went wrong while saving user info.`,
      );
    }
  }
  randomStringGenerator(num: number) {
    let length = num,
      charset =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      retVal = '';
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  }
  async staffSignUp(
    domain: string,
    signupCredDTO: StaffSignUpDto,
  ): Promise<StaffUserResposne> {
    const findUser = await this.userModel.findOne({
      main_account_owner: true,
      domain: domain,
    });
    if (!findUser) {
      throw new NotFoundException(`User not found`);
    }
    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException(`Settings not found`);
    }
    const { email, firstName, lastName, roles } = signupCredDTO;
    const user = new this.userModel();
    user.email = email;
    user.salt = await bcrypt.genSalt();
    user.firstName = firstName;
    user.lastName = lastName;
    user.domain = findUser.domain;
    user.main_account_owner = false;
    user.timezone = findUser.timezone;
    user.onboardingCompleted = true;
    user.roles = roles;
    const tempPassword = this.randomStringGenerator(8);
    user.password = await this.hashPassword(tempPassword, user.salt);
    try {
      const updatedUser = await user.save();

      const sendEmailNotificationToNewEmployee: createNewEmployeeEmailNotificationType =
        {
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          companyName: findCommonSettings.companySettings.companyName,
          password: tempPassword,
          domain: updatedUser.domain,
        };
      const sendToQueue = await this.sqsService.send(
        `${queueManager.employee.createNewEmployeeEmailNotification.queueName}`,
        {
          id: `${randomUUID()}`,
          body: sendEmailNotificationToNewEmployee,
        },
      );

      return {
        id: updatedUser._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles as RoleTypes[],
      };
    } catch (err) {
      console.log(err);

      throw new InternalServerErrorException(
        `something went wrong while signing up staff user.`,
      );
    }
  }

  async getUniqueDomain() {
    const domain = `${this.randomStringGenerator(4)}-${moment().unix()}`;
    try {
      await this.requestVerifyDomainDuringSignup(domain);
      return domain;
    } catch (err) {
      console.log('conflict');
      return await this.getUniqueDomain();
    }
  }

  async requestVerifyDomainDuringSignup(domain: string): Promise<string> {
    const restrictedDomains = [
      'dashboard.servicebuddy.io',
      'links.servicebuddy.io',
      'app.servicebuddy.io',
      'admin.servicebuddy.io',
      'staging-app.servicebuddy.io',
      'staging-dashboard.servicebuddy.io',
      'dev-app.servicebuddy.io',
      'dev-dashboard.servicebuddy.io',
      'cdn.servicebuddy.io',
      'staging-cdn.servicebuddy.io',
      'dev-cdn.servicebuddy.io',
      'prod-cdn.servicebuddy.io',
      'partner.servicebuddy.io',
      'staging-partner.servicebuddy.io',
      'dev-partner.servicebuddy.io',
      'test.servicebuddy.io',
      'testing.servicebuddy.io',
    ];
    if (domain.length <= 3) {
      throw new UnprocessableEntityException('Domain not allowed');
    }

    const formattedDomain = `${domain.toLowerCase()}.servicebuddy.io`;

    if (restrictedDomains.includes(formattedDomain)) {
      throw new UnprocessableEntityException('Domain not allowed');
    }

    const findUsers = await this.userModel.find({
      domain: domain.toLowerCase(),
    });
    if (findUsers && findUsers.length > 0) {
      throw new ConflictException('Domain already exists');
    } else {
      return 'ok';
    }
  }

  async requestVerifyPhoneDuringSignup(phone_number: string): Promise<string> {
    console.log(phone_number);
    return await this.textNotificationService.requestPhoneVerification(
      phone_number,
    );
  }

  async sendVerificationEmailLink(user_email: string) {
    const createVerifyEmailCode = await new this.verifyUserEmailModel();
    createVerifyEmailCode.email = user_email;
    createVerifyEmailCode.created_at = moment().unix();
    createVerifyEmailCode.expires_at = moment().add(24, 'hours').unix();
    createVerifyEmailCode.is_verified = false;
    createVerifyEmailCode.unique_code = `${uuid()}-${moment().unix()}`;
    if (!isEmail(user_email)) {
      throw new UnprocessableEntityException(
        'invalid email.Failed to send verification link.',
      );
    }
    try {
      await createVerifyEmailCode.save();
      const verificationLink = `${process.env.FRONT_END_URL}/email-verify?code=${createVerifyEmailCode.unique_code}`;
      const contentOfEmail = generateEmailVerificationText(verificationLink);

      const emailData: sendEmailDto = {
        from: `ServiceBuddy Account <no-reply@servicebuddy.io>`,
        html_content: `${contentOfEmail}`,
        text_content: ``,
        subject: `Verify Email for ServiceBuddy account`,
        reply_to_addresses: [],
        cc_addresses: [],
        to_addresses: [`${user_email}`],
      };
      const sendEmailToNewUser =
        await this.emailNotificationService.sendSimpleEmail(emailData);
      console.log('email sent to user');
      return 'email sent';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  async sendResetPasswordLink(user_email: string): Promise<string> {
    const sendResetPasswordEmail = await new this.resetUserPasswordModel();
    sendResetPasswordEmail.email = user_email;
    sendResetPasswordEmail.created_at = moment().unix();
    sendResetPasswordEmail.expires_at = moment().add(24, 'hours').unix();
    sendResetPasswordEmail.is_expired = false;
    sendResetPasswordEmail.unique_code = `${uuid()}-${moment().unix()}`;
    if (!isEmail(user_email)) {
      throw new UnprocessableEntityException(
        'invalid email.Failed to send verification link.',
      );
    }
    try {
      await sendResetPasswordEmail.save();
      const resetLink = `${process.env.FRONT_END_URL}/reset-password-with-link?code=${sendResetPasswordEmail.unique_code}`;
      const contentOfEmail = `${generateResetEmailText(resetLink)}`;

      const emailData: sendEmailDto = {
        from: `ServiceBuddy Account <no-reply@servicebuddy.io>`,
        html_content: `${contentOfEmail}`,
        text_content: ``,
        subject: `Reset Password for ServiceBuddy account`,
        reply_to_addresses: [],
        cc_addresses: [],
        to_addresses: [`${user_email}`],
      };
      const sendEmailToNewUser =
        await this.emailNotificationService.sendSimpleEmail(emailData);
      console.log('email sent to user');
      return 'email sent';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
  async changePasswordWithLink(code: string, new_password: string) {
    const findVerificationModelLink = await this.resetUserPasswordModel.findOne(
      {
        unique_code: code,
      },
    );
    if (!findVerificationModelLink) {
      throw new NotFoundException('invalid code');
    }
    if (findVerificationModelLink.is_expired) {
      throw new UnprocessableEntityException('code expired');
    }
    if (findVerificationModelLink.expires_at < moment().unix()) {
      throw new UnprocessableEntityException('code expired');
    }
    const findUser = await this.userModel.findOne({
      email: findVerificationModelLink.email,
    });
    if (!findVerificationModelLink) {
      throw new NotFoundException('User Not found');
    }
    try {
      findVerificationModelLink.is_expired = true;
      findUser.salt = await bcrypt.genSalt();
      findUser.password = await this.hashPassword(new_password, findUser.salt);
      await findVerificationModelLink.save();
      await findUser.save();
      console.log('new password saved');
      return 'Password Changed';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Failed to verify code');
    }
  }
  v;
  async verifyEmailLink(code: string) {
    const findVerificationModelLink = await this.verifyUserEmailModel.findOne({
      unique_code: code,
    });
    if (!findVerificationModelLink) {
      throw new NotFoundException('invalid code');
    }
    if (findVerificationModelLink.expires_at < moment().unix()) {
      throw new UnprocessableEntityException('code expired');
    }
    const findUser = await this.userModel.findOne({
      email: findVerificationModelLink.email,
    });
    if (!findVerificationModelLink) {
      throw new NotFoundException('User Not found');
    }
    try {
      findVerificationModelLink.is_verified = true;
      findUser.email_verified = true;
      await findVerificationModelLink.save();
      await findUser.save();
      return 'Verified Email';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Failed to verify code');
    }
  }

  async signIn(authCredDTO: AuthCredentialsDto): Promise<any> {
    const data = await this.validateUserPassword(authCredDTO);
    if (!data) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload: jwtPayload = { email: data.email, domain: data.domain };
    const accessToken = await this.jwtService.sign(payload);

    const userSignInEvent: UserSignedInEvent = {
      createdAt: moment().unix(),
      domain: data.domain,
      email: data.email,
      userId: `NA`,
    };

    const sendToQueue = await this.sqsService.send(
      `${queueManager.user.userSignedInAdminNotification.queueName}`,
      {
        id: `${randomUUID()}`,
        body: userSignInEvent,
      },
    );
    console.log('queue message sent');
    return { accessToken };
  }
  async signInForAdmin(email: string, token: string): Promise<string> {
    if (!process.env.ADMIN_ACCESS_TOKEN) {
      console.log('access token for admin not provided');
      throw new UnprocessableEntityException('Invalid token');
    }
    const verifyToken = process.env.ADMIN_ACCESS_TOKEN === token;
    if (!verifyToken) {
      throw new UnauthorizedException('Invalid token');
    }
    const findUser = await this.findUserByEmail(email);
    if (!findUser) {
      throw new NotFoundException('User Not Found');
    }
    const payload: jwtPayload = {
      email: findUser.user.email,
      domain: findUser.user.domain,
    };
    const accessToken = await this.jwtService.sign(payload);

    const userSignInEvent: UserSignedInEvent = {
      createdAt: moment().unix(),
      domain: payload.domain,
      email: payload.email,
      userId: `NA`,
    };

    const sendToQueue = await this.sqsService.send(
      `${queueManager.user.userSignedInAdminNotificationForSuperADMIN.queueName}`,
      {
        id: `${randomUUID()}`,
        body: userSignInEvent,
      },
    );
    console.log('queue message sent');
    return accessToken;
  }
  async signInUserWithGoogle(
    authCredGoogleDto: AuthCredentialsDtoForGoogle,
  ): Promise<any> {
    const { token } = authCredGoogleDto;
    const googleOAuthClient: Auth.OAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_O_AUTH_CLIENT_ID,
      process.env.GOOGLE_O_AUTH_CLIENT_SECRET,
    );
    const tokenInfo = await googleOAuthClient.verifyIdToken({ idToken: token });

    const email = tokenInfo.getPayload().email;
    if (!email) {
      throw new UnauthorizedException('User not found!');
    }

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('User does not exist!');
    }
    try {
      const payload: jwtPayload = { email: user.email, domain: user.domain };
      const accessToken = await this.jwtService.sign(payload);

      try {
        const userSignInEvent: UserSignedInEvent = {
          createdAt: moment().unix(),
          domain: user.domain,
          email: user.email,
          userId: `NA`,
        };

        const sendToQueue = await this.sqsService.send(
          `${queueManager.user.userSignedInAdminNotification.queueName}`,
          {
            id: `${randomUUID()}`,
            body: userSignInEvent,
          },
        );
      } catch (err) {
        console.log(err);
        console.log('failed to send to queue slack message');
      }
      return {
        accessToken,
      };
    } catch (error) {
      if (error.status !== 404) {
        throw new InternalServerErrorException(`Something went wrong!`);
      }
    }
  }
  async signUpWithGoogle(
    signUpCredDTOForGoogle: SignUpDtoWithGoogle,
  ): Promise<void> {
    const { token, timezone } = signUpCredDTOForGoogle;
    const googleOAuthClient: Auth.OAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_O_AUTH_CLIENT_ID,
      process.env.GOOGLE_O_AUTH_CLIENT_SECRET,
    );
    const tokenInfo = await googleOAuthClient.verifyIdToken({ idToken: token });

    const userData = tokenInfo.getPayload();
    const userEmail = tokenInfo.getPayload().email;
    const domain = await this.getUniqueDomain();

    const findUserWithEmail = await this.userModel.findOne({
      email: userEmail,
    });
    if (findUserWithEmail) {
      throw new ConflictException(`User already exists`);
    }
    const findUser = await this.userModel.find({
      domain: domain,
    });
    if (findUser.length > 0) {
      throw new ConflictException(`User with domain already exists`);
    }

    try {
      const verifyEmail = await deepEmailValidator.validate({
        validateSMTP: false,
        email: userEmail,
      });
      if (!verifyEmail.valid) {
        throw new UnprocessableEntityException('Invalid email');
      }
    } catch (err) {
      throw new UnprocessableEntityException('Invalid email');
    }

    const user = new this.userModel();
    user.email = userEmail;
    user.salt = await bcrypt.genSalt();
    user.email_verified = true;
    user.mobile_verified = false;
    user.firstName = userData.given_name;
    user.lastName = userData.family_name;
    user.domain = `${domain}`;
    user.onboardingCompleted = false;
    user.main_account_owner = true;
    user.timezone = timezone;
    user.roles = [RoleTypes.ADMIN];
    user.sign_in_provider = 'google';
    const generatedPassword = this.randomStringGenerator(8);
    user.password = await this.hashPassword(generatedPassword, user.salt);
    try {
      const newUser = await user.save();

      const sendUserNamePasswordToCustomer: sendEmailNotificationGeneralType = {
        from_email: process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,
        to_email: user.email,
        content: `<p>
        Your username: ${user.email} <br />
        & Your password: ${generatedPassword} <br />
        Join this link: ${process.env.FRONT_END_URL} <br />
      </p>`,
        companyName: `ServiceBuddy Admin`,
        email_subject: `Your credential for ServiceBuddy`,
      };

      const sendToQueueForGeneralEmail = await this.sqsService.send(
        `${queueManager.emailNotification.sendEmailNotificationGeneral.queueName}`,
        {
          id: `${randomUUID()}`,
          body: sendUserNamePasswordToCustomer,
        },
      );
      console.log('queue message sent-email-pw');

      const newUserSignUpEvent: NewUserSignupEvent = {
        createdAt: newUser.created_at_timestamp,
        domain: newUser.domain,
        email: newUser.email,
        userId: newUser._id,
      };
      const sendToQueue = await this.sqsService.send(
        `${queueManager.user.createNewUserAdminNotification.queueName}`,
        {
          id: `${randomUUID()}`,
          body: newUserSignUpEvent,
        },
      );
      console.log('queue message sent-slack-notification');
    } catch (err) {
      console.log(err);
      if ((err.code = '11000')) {
        throw new ConflictException('user already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
  async changePassword(
    user: User,
    changePasswordData: changePasswordDTO,
  ): Promise<any> {
    const { oldPassword, newPassword } = changePasswordData;

    const findUser = await this.userModel.findOne({
      email: user.email,
      domain: user.domain,
    });
    if (!findUser) {
      throw new NotFoundException(`User not found`);
    }
    const data = await this.validateUserPassword({
      email: findUser.email,
      password: oldPassword,
    });
    if (!data) {
      throw new UnauthorizedException('Invalid Password');
    }
    try {
      findUser.salt = await bcrypt.genSalt();
      findUser.password = await this.hashPassword(newPassword, findUser.salt);
      const updateUser = await findUser.save();

      return 'Updated password';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(`Something went wrong`);
    }
  }
  async getStaffUsers(user: User): Promise<StaffUserResposne[]> {
    const findUser = await this.userModel.findOne({
      email: user.email,
      domain: user.domain,
    });
    if (!findUser) {
      throw new NotFoundException(`User not found`);
    }
    try {
      const findAllUsers = await this.userModel.find({
        domain: findUser.domain,
        main_account_owner: false,
      });
      return findAllUsers.map((userOb) => {
        return {
          id: userOb._id,
          firstName: userOb.firstName,
          lastName: userOb.lastName,
          email: userOb.email,
          roles: userOb.roles as RoleTypes[],
        };
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(`Something went wrong`);
    }
  }
  async validateUserPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<any> {
    const { email, password } = authCredentialsDto;
    const user = await this.userModel.findOne({ email });
    if (
      user &&
      (await this.validatePassword(password, user.password, user.salt))
    ) {
      return {
        email: user.email,
        domain: user.domain,
      };
    } else {
      return null;
    }
  }

  async findUserByAPIkey(key: string): Promise<{
    user: User;
    commonSettings: CommonSettings;
  }> {
    const findUser = await this.userModel.findOne({ PUBLIC_API_KEY: key });
    if (!findUser) {
      throw new UnauthorizedException('Invalid API_KEY');
    }
    console.log('user found');
    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: findUser.domain,
    });
    if (!findCommonSettings) {
      const findRootUser = await this.userModel.findOne({
        domain: findUser.domain,
        main_account_owner: true,
      });
      if (findRootUser) {
        const createNewCommonSettings = new this.commonSettingsModel();
        createNewCommonSettings.domain = findUser.domain;
        createNewCommonSettings.root_user_id = findUser._id;
        createNewCommonSettings.paymentSetupCompleted = false;
        createNewCommonSettings.companySettings = {
          companyEmail: ``,
          companyLogo: ``,
          companyName: ``,
          companyPhone: ``,
          companySize: ``,
        };
        createNewCommonSettings.invoiceSettings = {
          companyName: '',
          companyEmail: '',
          companyPhone: '',
          addressInfo: {
            street_address_1: '',
            street_address_2: '',
            state: '',
            city: '',
            country: '',
            post_code: '',
          },
          vatInfo: '',
          footer: '',
          prefix: '',
          showCompanyLogo: false,
          showVatInfo: false,
          showDueDate: false,
          showPaymentLink: false,
          textTemplate: '',
          emailTemplate: '',
        };
        createNewCommonSettings.estimateSettings = {
          companyName: '',
          companyEmail: '',
          companyPhone: '',
          addressInfo: {
            street_address_1: '',
            street_address_2: '',
            state: '',
            city: '',
            country: '',
            post_code: '',
          },
          vatInfo: '',
          footer: '',
          prefix: '',
          showCompanyLogo: false,
          showVatInfo: false,
          showValidityDate: false,
          textTemplate: '',
          emailTemplate: '',
        };
        createNewCommonSettings.google_business_link = '';
        createNewCommonSettings.currency = 'USD';
        createNewCommonSettings.taxRate = `18`;
        createNewCommonSettings.available_credits = 10;
        createNewCommonSettings.addressInfo = {
          street_address_1: ``,
          street_address_2: ``,
          state: ``,
          country: ``,
          city: ``,
          post_code: ``,
        };
        await createNewCommonSettings.save();
      }
    }
    console.log('done');

    return { user: findUser, commonSettings: findCommonSettings };
  }
  async findUserByEmail(email: string): Promise<{
    user: User;
    commonSettings: CommonSettings;
  }> {
    const user = await this.userModel.findOne({ email });
    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: user.domain,
    });
    if (!findCommonSettings) {
      const findRootUser = await this.userModel.findOne({
        domain: user.domain,
        main_account_owner: true,
      });
      if (findRootUser) {
        const createNewCommonSettings = new this.commonSettingsModel();
        createNewCommonSettings.domain = user.domain;
        createNewCommonSettings.root_user_id = user._id;
        createNewCommonSettings.paymentSetupCompleted = false;
        createNewCommonSettings.companySettings = {
          companyEmail: ``,
          companyLogo: ``,
          companyName: ``,
          companyPhone: ``,
          companySize: ``,
        };
        createNewCommonSettings.invoiceSettings = {
          companyName: '',
          companyEmail: '',
          companyPhone: '',
          addressInfo: {
            street_address_1: '',
            street_address_2: '',
            state: '',
            city: '',
            country: '',
            post_code: '',
          },
          vatInfo: '',
          footer: '',
          prefix: '',
          showCompanyLogo: false,
          showVatInfo: false,
          showDueDate: false,
          showPaymentLink: false,
          textTemplate: '',
          emailTemplate: '',
        };
        createNewCommonSettings.estimateSettings = {
          companyName: '',
          companyEmail: '',
          companyPhone: '',
          addressInfo: {
            street_address_1: '',
            street_address_2: '',
            state: '',
            city: '',
            country: '',
            post_code: '',
          },
          vatInfo: '',
          footer: '',
          prefix: '',
          showCompanyLogo: false,
          showVatInfo: false,
          showValidityDate: false,
          textTemplate: '',
          emailTemplate: '',
        };
        createNewCommonSettings.google_business_link = '';
        createNewCommonSettings.currency = 'USD';
        createNewCommonSettings.taxRate = `18`;
        createNewCommonSettings.available_credits = 10;
        createNewCommonSettings.addressInfo = {
          street_address_1: ``,
          street_address_2: ``,
          state: ``,
          country: ``,
          city: ``,
          post_code: ``,
        };
        await createNewCommonSettings.save();
      }
    }

    return { user, commonSettings: findCommonSettings };
  }
  async sendCustomSESVerificationEmail(
    user: User,
    custom_email: string,
  ): Promise<string> {
    try {
      awsSDK.config.update({ region: process.env.AWS_REGION });

      const ses = new awsSDK.SES();
      const sendCustomVerificationEmail = await ses
        .sendCustomVerificationEmail({
          TemplateName: process.env.VERIFICATION_EMAIL_TEMPLATE,
          EmailAddress: custom_email,
        })
        .promise();
      return 'ok';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(
        'Something went wrong while sending custom email.',
      );
    }
  }
  async getPublicUserInfo(domain: string): Promise<PublicUserInfoData> {
    const user = await this.userModel.findOne({ domain });
    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: user.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException(`Settings not found`);
    }
    if (user) {
      return {
        domain: user.domain,
        companyLogo: findCommonSettings.companySettings.companyLogo,
        companyName: findCommonSettings.companySettings.companyName,
      };
    } else {
      throw new NotFoundException('No account found.');
    }
  }
  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
  private async validatePassword(
    password: string,
    savedPW: string,
    salt: string,
  ): Promise<boolean> {
    const hash = await bcrypt.hash(password, salt);
    return hash === savedPW;
  }
  getUrlFromBucket(s3Bucket: string, region: string) {
    const regionString = region.includes('us-east-1') ? '' : '-' + region;
    return `https://s3${regionString}.amazonaws.com`;
  }
  async getPreSignedUploadURL(
    user: User,
    filename: string,
    filetype: string,
  ): Promise<any> {
    const bucketS3 = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    const bucket_url = this.getUrlFromBucket(bucketS3, region);
    const s3 = new S3({
      signatureVersion: 'v4',
      region: region,
      endpoint: `${bucket_url}`,
    });
    const signedUrlExpireSeconds = 60 * 5;
    const URL_FOR_UPLOAD = `${process.env.APP_ENV}/${
      user.domain
    }/${moment().unix()}-${filename}`;
    try {
      const url = await s3.getSignedUrlPromise('putObject', {
        Bucket: bucketS3,
        Key: `${URL_FOR_UPLOAD}`,
        ContentType: filetype,
        Expires: signedUrlExpireSeconds,
      });
      // const downloadURL =
      //   process.env.APP_ENV === 'prod'
      //     ? `${process.env.CDN_URL}/${bucketS3}/${URL_FOR_UPLOAD}`
      //     : `${bucket_url}/${bucketS3}/${URL_FOR_UPLOAD}`;
      const downloadURL = `${bucket_url}/${bucketS3}/${URL_FOR_UPLOAD}`;
      return {
        uploadURL: url,
        downloadURL: `${downloadURL}`,
      };
    } catch (err) {
      console.log(err);
      throw new UnprocessableEntityException('Cant get url');
    }
  }
}
