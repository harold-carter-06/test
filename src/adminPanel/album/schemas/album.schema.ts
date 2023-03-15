import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class Album {
  @Prop()
  title: string;

  @Prop()
  image: string;

  @Prop()
  description: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdAt: number;

  @Prop()
  updatedAt: number;
}
export const AlbumSchema = SchemaFactory.createForClass(Album);
