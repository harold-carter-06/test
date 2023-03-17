import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class DbCounter extends Document {
  @Prop()
  collection_name: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  root_user_id: Types.ObjectId;

  @Prop()
  counter: number;

  @Prop()
  created_at: string;

  @Prop()
  updated_at: string;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;
}

export const DbCounterSchema = SchemaFactory.createForClass(DbCounter);
