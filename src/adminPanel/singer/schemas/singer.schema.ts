import { Schema, Prop, SchemaFactory, raw } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class Singer {
  @Prop()
  name: string;

  @Prop()
  image: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdAt: number;

  @Prop()
  updatedAt: number;
}
export const SingerSchema = SchemaFactory.createForClass(Singer);
