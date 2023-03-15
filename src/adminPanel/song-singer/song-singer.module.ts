import { Module } from '@nestjs/common';
import { SongSingerService } from './song-singer.service';
import { SongSingerController } from './song-singer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Song, SongSchema } from 'src/adminPanel/song/schemas/song.schema';
import { SongSinger, SongSingerSchema } from 'src/adminPanel/song-singer/schemas/song-singer.schema';
import { Singer, SingerSchema } from 'src/adminPanel/singer/schemas/singer.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Song.name, schema: SongSchema },
      { name: SongSinger.name, schema: SongSingerSchema },
      { name: Singer.name, schema: SingerSchema },
    ]),
  ],
  controllers: [SongSingerController],
  providers: [SongSingerService]
})
export class SongSingerModule {}
