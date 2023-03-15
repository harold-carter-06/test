import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
@Schema({ timestamps: true })
export class Category {
  @Prop()
  name: string;

  @Prop()
  inFocus: boolean;

  @Prop()
  inTrending: boolean;

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

export const CategorySchema = SchemaFactory.createForClass(Category);
