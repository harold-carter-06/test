import { forwardRef, Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ActivityQueueConsumer } from './queue-consumer/activity-queue.consumer';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/user/user.module';
import { ActivitySchema } from './model/activity.model';
import { queueManager } from 'src/queue-manager/queue-manager';
import { SqsModule } from 'src/sqs-custom-module';

@Module({
  imports: [
    SqsModule.registerAsync({
      useFactory: async () => {
        let allConsumers = [
          queueManager.activity.createActivityEvent.queueName,
        ];
        let allProducers = [];
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
    MongooseModule.forFeature([
      {
        name: 'Activity',
        schema: ActivitySchema,
      },
    ]),
    forwardRef(() => UserModule),
  ],
  providers: [ActivityService, ActivityQueueConsumer],
  controllers: [ActivityController],
  exports: [ActivityService, MongooseModule],
})
export class ActivityModule {}
