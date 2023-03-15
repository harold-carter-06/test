import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserSchema, User } from './schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      secret: 'w558XFrKN5Ue78eaLRsXSpe5zF9Q2jvC2b9DMM5r',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
