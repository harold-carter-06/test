import { MiddlewareConsumer, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/user.module";
import { CategoryModule } from "./adminPanel/category/category.module";
import { AuthMiddleware } from "./middleware/auth.middleware";
import { ConfigModule } from "@nestjs/config";
import { SongModule } from "./adminPanel/song/song.module";
import { SingerModule } from "./adminPanel/singer/singer.module";
import { AlbumModule } from "./adminPanel/album/album.module";
import { AdminModule } from "./adminPanel/admin/admin.module";
import { SongSingerModule } from './adminPanel/song-singer/song-singer.module';
@Module({
  imports: [
    ConfigModule.forRoot(),
    // MongooseModule.forRoot(process.env.DB_URL),
    // UserModule,
    // CategoryModule,
    // SongModule,
    // SingerModule,
    // AlbumModule,
    // AdminModule,
    // SongSingerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer
  //     .apply(AuthMiddleware)
  //     .exclude(
  //       "/admin/login",
  //       "/user/singup",
  //       "/user/login",
  //       "/user/verify/otp",
  //       "/song/add",
  //       "/category/add",
  //       "/user/google/login",
  //       "/"
  //     )
  //     .forRoutes("/");
  // }
}
