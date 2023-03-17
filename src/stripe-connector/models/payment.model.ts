import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import mongoose from 'mongoose';

@Schema()
export class Payment extends mongoose.Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  root_user_id: Types.ObjectId;

  @Prop()
  domain: string;

  @Prop()
  client_name: string;

  @Prop()
  client_email: string;

  @Prop()
  date: number;

  @Prop()
  payment_type: string;

  @Prop()
  amount: number;

  @Prop()
  invoice_sequence_id: number;

  @Prop({ type: Object, default: '' })
  payment_method_type: object;

  @Prop({ type: Object, default: {} })
  payment_detail: object;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
