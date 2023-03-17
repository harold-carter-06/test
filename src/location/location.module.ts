import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DbCounterModule } from '../db-counter/db-counter.module';
import { UserModule } from '../user/user.module';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { LocationSchema } from './model/location.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Locations',
        schema: LocationSchema,
      },
    ]),

    UserModule,
    DbCounterModule,
  ],
  controllers: [LocationController],
  providers: [LocationService],

  exports: [MongooseModule, LocationService],
})
export class LocationModule {}
