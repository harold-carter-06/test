import { Module } from '@nestjs/common';
import { SongService } from './song.service';
import { SongController } from './song.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Song ,SongSchema } from './schemas/song.schema'
import { Category,CategorySchema } from '../../adminPanel/category/schemas/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Song.name, schema: SongSchema },
      { name: Category.name, schema: CategorySchema }
    ]),
  ],
  // exports: [UserService],
  controllers: [SongController],
  providers: [SongService]
})
export class SongModule {}
