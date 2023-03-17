import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  CalendarColorOptions,
  CommonSettings,
  EstimateSettings,
  InvoiceSettings,
  StripePaymentSetting,
} from 'src/common-settings/common-settings.model';
import { RoleTypes } from '../roles.decorator';
import { AddressInfo, User } from './models/user.model';
export interface getUser {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companyLogo: string;
  companyEmail: string;
  companyPhone: string;
  domain: string;
  email_verified: boolean;
  onboardingCompleted: boolean;
  paymentSetupCompleted: boolean;
  roles: RoleTypes[];
  currency: string;
  timezone: string;
  addressInfo: AddressInfo;
  user_profile_logo: string;
  taxRate: string;
  calendarOptions: CalendarColorOptions[];
  accountOwner: boolean;
  availableCredits: number;
  eventStringFormat: string;
  invoiceSettings: InvoiceSettings;
  estimateSettings: EstimateSettings;
  google_business_link: string;
  stripePaymentSetting: StripePaymentSetting;
}

export const GetUser = createParamDecorator(
  (data, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const { user, commonSettings } = request.user as {
      user: User;
      commonSettings: CommonSettings;
    };

    const formatted_user: getUser = {
      email_verified: user.email_verified,
      domain: user.domain,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: commonSettings.companySettings.companyName,
      companyLogo: commonSettings.companySettings.companyLogo,
      companyEmail: commonSettings.companySettings.companyEmail,
      companyPhone: commonSettings.companySettings.companyPhone,
      email: user.email,
      roles: user.roles,
      currency: commonSettings.currency,
      onboardingCompleted: user.onboardingCompleted,
      paymentSetupCompleted: commonSettings.paymentSetupCompleted,
      calendarOptions: commonSettings.calendarColors,
      timezone: user.timezone,
      addressInfo: commonSettings.addressInfo,
      user_profile_logo: user.user_profile_logo,
      taxRate: commonSettings.taxRate,
      accountOwner: user.main_account_owner,
      availableCredits: commonSettings.available_credits,
      eventStringFormat: commonSettings.calendarBookingEventStringFormat,
      invoiceSettings: commonSettings.invoiceSettings,
      estimateSettings: commonSettings.estimateSettings,
      google_business_link: commonSettings.google_business_link,
      stripePaymentSetting: commonSettings.stripePaymentSetting,
    };
    return formatted_user;
  },
);
