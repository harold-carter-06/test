import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Task extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  createdByUserId: Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  lastUpdatedByUserId: Types.ObjectId;

  @Prop({ required: true })
  domain: string;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({
    type: Array,
    default: [],
  })
  employee_ids: string[];

  @Prop({
    type: Array,
    default: [],
  })
  location_ids: string[];

  @Prop({
    type: Array,
    default: [],
  })
  customer_ids: string[];

  @Prop()
  calendar_color: string;

  @Prop()
  task_sequence_id: number;

  @Prop()
  task_created_at_timestamp: number;

  @Prop()
  task_updated_at_timestamp: number;

  @Prop()
  task_calendar_timestamp: number;

  @Prop()
  reminder_timestamp: number;

  @Prop()
  should_remind: boolean;

  @Prop()
  did_remind: boolean;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
