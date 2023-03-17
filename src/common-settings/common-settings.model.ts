import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { AddressInfo } from 'src/user/models/user.model';

export interface CompanyInfo {
  companyName: string;
  companyLogo: string;
  companyEmail: string;
  companyPhone: string;
  companySize: string;
}

export interface InvoiceSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  addressInfo: AddressInfo;
  vatInfo: string;
  footer: string;
  prefix: string;
  showCompanyLogo: boolean;
  showVatInfo: boolean;
  showDueDate: boolean;
  showPaymentLink: boolean;
  textTemplate: string;
  emailTemplate: string;
}
export interface EstimateSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  addressInfo: AddressInfo;
  vatInfo: string;
  footer: string;
  prefix: string;
  showCompanyLogo: boolean;
  showVatInfo: boolean;
  showValidityDate: boolean;
  textTemplate: string;
  emailTemplate: string;
}

export interface CalendarColorOptions {
  color: string;
  text: string;
}

export interface StripePaymentSetting {
  subscriptionId: string;
  startDate: string;
  trialStart: string;
  trialEnd: string;
  user: string;
  isTrialTaken: boolean;
  paymentStatus: string;
  subscriptionStatus: string;
  isTrialEnd: boolean;
}

export interface businessHours {
  day: string;
  startingTime: string;
  closingTime: string;
  isWorking: string;
}

@Schema()
export class CommonSettings extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  root_user_id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  domain: string;

  @Prop()
  available_credits: number;

  @Prop({
    type: Object,
    default: {
      companyName: '',
      companyLogo: '',
      companyEmail: '',
      companyPhone: '',
    },
  })
  companySettings: CompanyInfo;

  @Prop({
    type: Object,
  })
  invoiceSettings: InvoiceSettings;

  @Prop()
  custom_domain_verified: boolean;

  @Prop()
  custom_domain_email: string;

  @Prop({
    type: Object,
  })
  estimateSettings: EstimateSettings;

  @Prop({ type: Object })
  addressInfo: AddressInfo;

  @Prop({
    type: Array,
    default: [],
  })
  businessHours: businessHours[];

  @Prop()
  stripeTokenId: string;

  @Prop({ type: Object })
  stripePaymentResponse: object;

  @Prop({ type: Object })
  stripePaymentSetting: StripePaymentSetting;

  @Prop()
  planType: string;

  @Prop()
  taxRate: string;

  @Prop()
  google_business_link: string;

  @Prop()
  paymentSetupCompleted: boolean;
  @Prop()
  stripeConnectAccountId: string;
  @Prop()
  stripeCustomerId: string;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ default: '#{{seq_id}}:{{first_name}} {{last_name}}' })
  calendarBookingEventStringFormat: string;

  @Prop({
    type: Array,
    default: [
      {
        color: '#4ade80',
        text: 'Green',
      },
      {
        color: '#f87171',
        text: 'Red',
      },
      {
        color: '#2dd4bf',
        text: 'Teal',
      },
      {
        color: '#581c87',
        text: 'Purple',
      },
      {
        color: '#facc15',
        text: 'Yellow',
      },
    ],
  })
  calendarColors: CalendarColorOptions[];

  @Prop({
    type: Array,
    default: [],
  })
  stayOrganize: string[];

  @Prop()
  created_at: string;

  @Prop()
  updated_at: string;

  @Prop({ type: Boolean, default: false })
  is_product_service: boolean;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  @Prop({ type: Boolean, default: false })
  is_business_hours: boolean;

  @Prop({ default: '' })
  facebook_url: string;

  @Prop({ default: '' })
  instagram_url: string;

  @Prop({ default: '' })
  twitter_url: string;

  @Prop({ default: '' })
  yelp_url: string;

  @Prop({ default: '' })
  angie_member_url: string;
}

export const CommonSettingsSchema =
  SchemaFactory.createForClass(CommonSettings);
