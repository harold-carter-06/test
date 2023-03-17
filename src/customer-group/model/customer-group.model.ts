import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class CustomerGroup extends Document {
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
  group_name: string;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;
}

export const CustomerGroupSchema = SchemaFactory.createForClass(CustomerGroup);
