import { Module } from '@nestjs/common';
import { queueManager } from 'src/queue-manager/queue-manager';
import { SqsModule } from 'src/sqs-custom-module';
import { TextNotificationModule } from 'src/text-notification/text-notification.module';
import { UserModule } from 'src/user/user.module';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [
    UserModule,
    TextNotificationModule,
    SqsModule.registerAsync({
      useFactory: async () => {
        let allConsumers = [];
        let allProducers = [
          queueManager.textNotification.sendReviewRequestTextNotification
            .queueName,
          queueManager.emailNotification.sendReviewRequestEmailNotification
            .queueName,
          queueManager.activity.createActivityEvent.queueName,
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
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
