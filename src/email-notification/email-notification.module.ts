import { Module } from '@nestjs/common';
import { SqsModule } from 'src/sqs-custom-module';
import { CommonModule } from 'src/common/common.module';
import { queueManager } from 'src/queue-manager/queue-manager';
import { UserModule } from 'src/user/user.module';
import { EmailNotificationController } from './email-notification.controller';
import { EmailNotificationService } from './email-notification.service';
import { EmailNotificationQueueConsumer } from './queue/email-notification-queue.consumer';

@Module({
  imports: [
    CommonModule,
    SqsModule.registerAsync({
      useFactory: async () => {
        let allConsumers = [
          queueManager.emailNotification
            .sendEmailNotificationForBookingConfirmation.queueName,

          queueManager.emailNotification.sendInvoiceEmailNotification.queueName,
          queueManager.emailNotification.sendEstimateEmailNotification
            .queueName,
        ];
        let allProducers = [
          queueManager.emailNotification
            .sendEmailNotificationForBookingConfirmation.queueName,

          queueManager.emailNotification.sendInvoiceEmailNotification.queueName,
          queueManager.emailNotification.sendEstimateEmailNotification
            .queueName,
        ];
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
  controllers: [EmailNotificationController],
  providers: [EmailNotificationService, EmailNotificationQueueConsumer],
  exports: [EmailNotificationService],
})
export class EmailNotificationModule {}
