import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { ItemTypes } from '../item-types';

@Schema()
export class Item extends Document {
  @Prop({ type: String, default: ItemTypes.SERVICE })
  type: ItemTypes;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  createdByUserId: Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  lastUpdatedByUserId: Types.ObjectId;

  @Prop({ required: true })
  domain: string;

  @Prop()
  name: string;

  @Prop()
  cost: number;

  @Prop()
  cost_decimals: number;

  @Prop()
  desc: string;

  @Prop()
  markup_percent: number;

  @Prop()
  unit_price: number;

  @Prop({ type: Array, default: [] })
  fields: any[];

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
