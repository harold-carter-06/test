import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema, ObjectId } from 'mongoose';
import { ProductItem } from '../../item/item-all.dto';
import { BillingDetails } from '../order-all.dto';

@Schema()
export class Order extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  createdByUserId: Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  lastUpdatedByUserId: Types.ObjectId;

  @Prop()
  domain: string;

  @Prop({ type: Boolean, default: true })
  show_job_time_checkbox: boolean;

  @Prop()
  order_sequence_id: number;

  @Prop()
  customer_ref_id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Invoices' })
  invoice_id: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Estimates' })
  estimate_id: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Quotes' })
  quote_id: Types.ObjectId;

  @Prop()
  order_created_at_timestamp: number;

  @Prop()
  order_updated_at_timestamp: number;

  @Prop()
  order_job_start_timestamp: number;

  @Prop()
  notes: string;

  @Prop()
  order_job_end_timestamp: number;

  @Prop()
  calendar_color: string;

  @Prop({ type: Array, default: [] })
  order_items: Partial<ProductItem>[];

  @Prop({ type: Array, default: [] })
  order_items_additional: Partial<ProductItem>[];

  @Prop()
  order_payment_completed: boolean;

  @Prop({ type: Object, default: {} })
  order_billing_details: BillingDetails;

  @Prop({ type: Boolean, default: false })
  link_notes_to_related_invoice: boolean;

  @Prop({ type: Array, default: [] })
  tags: string[];

  @Prop({ type: Boolean, default: false })
  converted_to_invoice: boolean;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  @Prop({ type: Boolean, default: false })
  is_archived: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
