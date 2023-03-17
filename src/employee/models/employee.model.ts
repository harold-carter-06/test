import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { RoleTypes } from '../../roles.decorator';

@Schema()
export class Employee extends Document {
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

  @Prop({ type: Array, default: [RoleTypes.ADMIN_STAFF] })
  access_level: RoleTypes[];

  @Prop({
    required: true,
    type: Array,
    default: [],
  })
  locationIds: string[];

  @Prop({
    required: true,
    type: Array,
    default: [],
  })
  employeeGroupIds: string[];

  @Prop()
  suffix: string;

  @Prop()
  first_name: string;

  @Prop()
  last_name: string;

  @Prop()
  phone_number: string;

  @Prop()
  email: string;

  @Prop()
  phone_number_alt: string;

  @Prop()
  notes: string;

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
  tags: string[];

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
