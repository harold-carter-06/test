import mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class ResetPasswordForUser extends mongoose.Document {
  @Prop({
    required: true,
  })
  email: string;

  @Prop({
    required: true,
    unique: true,
  })
  unique_code: string;

  @Prop()
  is_expired: boolean;

  @Prop()
  expires_at: number;

  @Prop()
  created_at: number;
}

export const ResetPasswordForUserSchema =
  SchemaFactory.createForClass(ResetPasswordForUser);
