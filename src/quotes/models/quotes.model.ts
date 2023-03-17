import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { ProductItem } from '../../quotes/dto/quotes-all.dto';
import { BillingDetails } from '../dto/quotes-all.dto';
import { QuoteStatus } from '../../helper/enum';

@Schema()
export class Quotes extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  createdByUserId: Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Users' })
  lastUpdatedByUserId: Types.ObjectId;

  @Prop()
  domain: string;

  @Prop()
  job_title: string;

  @Prop()
  customer_ref_id: string;

  @Prop()
  quote_created_at_timestamp: number;

  @Prop()
  quote_updated_at_timestamp: number;

  @Prop()
  quote_sequence_id: number;

  @Prop({ type: Array, default: [] })
  quote_items: Partial<ProductItem>[];

  @Prop({ type: Array, default: [] })
  quote_items_additional: Partial<ProductItem>[];

  @Prop({ type: Object, default: {} })
  quote_billing_details: BillingDetails;

  @Prop({ type: String, default: '' })
  quotes_notes_external: string;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  @Prop({ type: Boolean, default: false })
  is_archived: boolean;

  @Prop({
    enum: [
      QuoteStatus.DRAFT,
      QuoteStatus.AWAITING,
      QuoteStatus.CHANGE_REQUEST,
      QuoteStatus.APPROVED,
    ],
    default: QuoteStatus.DRAFT,
  })
  status: string;

  @Prop({ type: Boolean, default: false })
  converted_to_job: boolean;
}

export const QuoteSchema = SchemaFactory.createForClass(Quotes);
