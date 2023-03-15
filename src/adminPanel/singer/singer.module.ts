import { Module } from "@nestjs/common";
import { SingerService } from "./singer.service";
import { SingerController } from "./singer.controller";
import { SingerSchema, Singer } from "./schemas/singer.schema";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Singer.name, schema: SingerSchema }]),
  ],
  controllers: [SingerController],
  providers: [SingerService],
})
export class SingerModule {}
