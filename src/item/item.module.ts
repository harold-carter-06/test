import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { ItemSchema } from './models/item.model';
import { CommonSettingsModule } from 'src/common-settings/common-settings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Items',
        schema: ItemSchema,
      },
    ]),
    UserModule,
    CommonSettingsModule,
  ],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [MongooseModule, ItemService],
})
export class ItemModule {}
