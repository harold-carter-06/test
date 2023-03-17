import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class EmployeeOrder extends Document {
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Employees',
  })
  employeeId: Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Orders' })
  orderId: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;
}

export const EmployeeOrderSchema = SchemaFactory.createForClass(EmployeeOrder);
