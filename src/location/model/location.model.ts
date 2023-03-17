import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Location extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  createdByUserId: Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  lastUpdatedByUserId: Types.ObjectId;

  @Prop()
  created_at_timestamp: number;

  @Prop()
  updated_at_timestamp: number;

  @Prop({ required: true })
  domain: string;

  @Prop()
  location_name: string;

  @Prop()
  phone_number: string;

  @Prop()
  business_email: string;

  @Prop()
  phone_number_alt: string;

  @Prop()
  address_line_1: string;

  @Prop()
  address_line_2: string;

  @Prop()
  city: string;

  @Prop()
  country: string;

  @Prop()
  post_code: string;

  @Prop()
  google_address_id: string;

  @Prop()
  google_my_business_id: string;

  @Prop()
  instagram_profile: string;

  @Prop()
  facebook_profile: string;

  @Prop()
  notes: string;

  @Prop()
  channel: string;

  @Prop()
  tags: string[];

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
