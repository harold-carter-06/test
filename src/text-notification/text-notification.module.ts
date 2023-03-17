import { Module } from '@nestjs/common';
import { SqsModule } from 'src/sqs-custom-module';
import { CommonModule } from 'src/common/common.module';
import { queueManager } from 'src/queue-manager/queue-manager';
import { TextNotificationQueueConsumer } from './queue/text-notification-queue.consumer';
import { TextNotificationController } from './text-notification.controller';
import { TextNotificationService } from './text-notification.service';
import { CommonSettingsModule } from 'src/common-settings/common-settings.module';

@Module({
  imports: [
    CommonModule,
    CommonSettingsModule,
    SqsModule.registerAsync({
      useFactory: async () => {
        let allConsumers = [
          queueManager.textNotification.sendBookingConfirmationTextNotification
            .queueName, // name of the queue
          queueManager.textNotification.sendInvoiceTextNotification.queueName, // name of the queue
          queueManager.textNotification.sendEstimateTextNotification.queueName, // name of the queue
          queueManager.textNotification.sendReviewRequestTextNotification
            .queueName,
        ];
        let allProducers = [queueManager.user.deductCreditsForUser.queueName];

        return {
          consumers: allConsumers.map((elem) => {
            return {
              name: elem,

              messageAttributeNames: ['All'],
            };
          }),

          producers: allProducers.map((elem) => {
            return {
              name: elem,

              messageAttributeNames: ['All'],
            };
          }),
        };
      },
    }),
  ],
  controllers: [TextNotificationController],
  providers: [TextNotificationService, TextNotificationQueueConsumer],
  exports: [TextNotificationService],
})
export class TextNotificationModule {}
