import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { DynamicSiteLoaderController } from './dynamic-site-loader.controller';
import { DynamicSiteLoaderService } from './dynamic-site-loader.service';

@Module({
  imports: [UserModule],
  controllers: [DynamicSiteLoaderController],
  providers: [DynamicSiteLoaderService],
})
export class DynamicSiteLoaderModule {}
