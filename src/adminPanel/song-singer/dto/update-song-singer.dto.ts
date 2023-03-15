import { PartialType } from '@nestjs/swagger';
import { CreateSongSingerDto } from './create-song-singer.dto';

export class UpdateSongSingerDto extends PartialType(CreateSongSingerDto) {}
