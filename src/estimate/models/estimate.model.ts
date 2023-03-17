import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { ProductItem } from '../../item/item-all.dto';
import { BillingDetails } from '../all-estimate.dto';

@Schema()
export class Estimate extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  createdByUserId: Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  lastUpdatedByUserId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Orders' })
  order_id: Types.ObjectId;

  @Prop()
  domain: string;

  @Prop()
  estimate_sequence_id: number;

  @Prop()
  customer_ref_id: string;

  @Prop()
  estimate_created_at_timestamp: number;

  @Prop()
  estimate_updated_at_timestamp: number;

  @Prop({ type: String, default: '' })
  estimate_notes_external: string;

  @Prop({ type: Array, default: [] })
  estimate_items: Partial<ProductItem>[];

  @Prop({ type: Array, default: [] })
  estimate_items_additional: Partial<ProductItem>[];

  @Prop({ type: Object, default: {} })
  estimate_billing_details: BillingDetails;

  @Prop({ type: Array, default: [] })
  tags: string[];

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  @Prop({ type: Boolean, default: false })
  is_archived: boolean;
}

export const EstimateSchema = SchemaFactory.createForClass(Estimate);
