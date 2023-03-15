import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { CreateSongDto } from './create-song.dto';

export class UpdateSongDto extends PartialType(CreateSongDto) { }

export class GetSongIdDto {
    @ApiProperty()
    @IsMongoId()
    id: string;
}