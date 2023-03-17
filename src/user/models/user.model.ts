import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { RoleTypes } from '../../roles.decorator';
import moment from 'moment';

export interface AddressInfo {
  street_address_1: string;
  street_address_2: string;
  state: string;
  country: string;
  city: string;
  post_code: string;
}

@Schema()
export class User extends mongoose.Document {
  @Prop({
    required: true,
  })
  domain: string;

  @Prop()
  experienceLevel: string;

  @Prop({
    type: Number,
    default: moment().unix(),
  })
  created_at_timestamp: number;

  @Prop()
  updated_at_timestamp: number;

  @Prop({
    default: false,
    type: Boolean,
  })
  onboardingCompleted: boolean;

  @Prop()
  mobileNumber: string;

  @Prop({
    required: true,
    index: {
      unique: true,
    },
  })
  email: string;

  @Prop()
  password: string;

  @Prop()
  PUBLIC_API_KEY: string;

  @Prop()
  salt: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  industry: string;

  @Prop()
  user_profile_logo: string;

  @Prop({ default: 'local', type: String })
  sign_in_provider: string;

  @Prop({ type: Boolean, default: false })
  email_verified: boolean;

  @Prop({ type: Boolean, default: false })
  mobile_verified: boolean;

  @Prop({ type: Array, default: [RoleTypes.ADMIN] })
  roles: RoleTypes[];

  @Prop({ type: Boolean, default: false })
  main_account_owner: boolean;

  @Prop({ type: String, default: 'UTC' })
  timezone: string;
}

export const UserAuthSchema = SchemaFactory.createForClass(User);
