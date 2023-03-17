import { Module } from '@nestjs/common';
import { SlackNotificationService } from './slack-notification.service';

@Module({
  imports: [],
  controllers: [],
  providers: [SlackNotificationService],
  exports: [SlackNotificationService],
})
export class BackendSystemModule {}
