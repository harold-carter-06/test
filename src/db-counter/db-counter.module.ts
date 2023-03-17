import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DbCounterController } from './db-counter.controller';
import { DbCounterSchema } from './db-counter.model';
import { DbCounterService } from './db-counter.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'dbcounter',
        schema: DbCounterSchema,
      },
    ]),
  ],
  controllers: [DbCounterController],
  providers: [DbCounterService],
  exports: [MongooseModule, DbCounterService],
})
export class DbCounterModule {}
