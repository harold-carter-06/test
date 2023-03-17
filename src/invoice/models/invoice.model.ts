import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { ProductItem } from '../../item/item-all.dto';
import { BillingDetails } from '../all-invoice.dto';

@Schema()
export class Invoice extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  createdByUserId: Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  lastUpdatedByUserId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Orders' })
  order_id: Types.ObjectId;

  @Prop()
  domain: string;

  @Prop()
  invoice_sequence_id: number;

  @Prop()
  customer_ref_id: string;

  @Prop()
  invoice_created_at_timestamp: number;

  @Prop()
  invoice_updated_at_timestamp: number;

  @Prop()
  invoice_due_date: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  invoice_payment_completed: boolean;

  @Prop()
  invoice_payment_link: string;

  @Prop()
  invoice_stripe_session_id: string;

  @Prop({ type: String, default: '' })
  invoice_notes_external: string;

  @Prop({ type: Array, default: [] })
  invoice_items: Partial<ProductItem>[];

  @Prop({ type: Array, default: [] })
  invoice_items_additional: Partial<ProductItem>[];

  @Prop({ type: Object, default: {} })
  invoice_billing_details: BillingDetails;

  @Prop({ type: Array, default: [] })
  tags: string[];

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  @Prop({ type: Boolean, default: false })
  is_archived: boolean;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
