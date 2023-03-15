
import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

@Schema({ timestamps: true })
export class SongSinger {
  @Prop({
    type:mongoose.Schema.Types.ObjectId,
    ref:'Song',
    required:true
  })
  songId: string;

  @Prop({
    type:mongoose.Schema.Types.ObjectId,
    ref:'Singer',
    required:true
  })
  singerId: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdAt: number;

  @Prop()
  updatedAt: number;
}
export const SongSingerSchema = SchemaFactory.createForClass(SongSinger);
