import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SqsModule } from 'src/sqs-custom-module';
import { CommonModule } from 'src/common/common.module';
import { queueManager } from 'src/queue-manager/queue-manager';
import { CommonSettingsModule } from '../common-settings/common-settings.module';
import { CustomerModule } from '../customer/customer.module';
import { DbCounterModule } from '../db-counter/db-counter.module';
import { ItemModule } from '../item/item.module';
import { OrderModule } from '../order/order.module';
import { UserModule } from '../user/user.module';
import { EstimateController } from './estimate.controller';
import { EstimateService } from './estimate.service';
import { EstimateSchema } from './models/estimate.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Estimates',
        schema: EstimateSchema,
      },
    ]),
    SqsModule.registerAsync({
      useFactory: async () => {
        let allConsumers = [];
        let allProducers = [
          queueManager.emailNotification.sendEstimateEmailNotification
            .queueName,
          queueManager.textNotification.sendEstimateTextNotification.queueName,
          queueManager.activity.createActivityEvent.queueName, // name of the queue
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

    forwardRef(() => CustomerModule),
    forwardRef(() => OrderModule),
    UserModule,
    ItemModule,
    CommonSettingsModule,
    DbCounterModule,
    CommonModule,
  ],
  controllers: [EstimateController],
  providers: [EstimateService],
  exports: [MongooseModule, EstimateService],
})
export class EstimateModule {}
