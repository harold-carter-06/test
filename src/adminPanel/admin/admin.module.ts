import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from './schemas/admin.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
    JwtModule.register({
      secret: 'w558XFrKN5Ue78eaLRsXSpe5zF9Q2jvC2b9DMM5r',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
