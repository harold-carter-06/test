import { Schema, Prop, SchemaFactory} from '@nestjs/mongoose';

@Schema({timestamps:true})
export class Song {
  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop()
  categoryId: string;

  @Prop()
  path: string;

  @Prop()
  duration: string;

  @Prop()
  coverImage: string;

  @Prop({default:true})
  isActive: Boolean;

  @Prop({default:false})
  isDeleted: Boolean;

  @Prop()
  createdAt: Number;

  @Prop()
  updatedAt: Number;
}
export const SongSchema = SchemaFactory.createForClass(Song);