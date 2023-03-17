import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Activity extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  created_by_user_id: Types.ObjectId;

  @Prop()
  activity_name: string;
  @Prop()
  desc: string;

  @Prop()
  activity_type: string;

  @Prop()
  domain: string;

  @Prop()
  action_link: string;

  @Prop({ type: Object, default: {} })
  before_values: any;

  @Prop({ type: Object, default: {} })
  after_values: any;

  @Prop({ type: Object, default: {} })
  difference: any;

  @Prop()
  created_at: number;

  @Prop()
  updated_at: number;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
