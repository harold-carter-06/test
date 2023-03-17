import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SqsModule } from 'src/sqs-custom-module';
import { queueManager } from 'src/queue-manager/queue-manager';
import { CustomerModule } from 'src/customer/customer.module';
import { UserModule } from 'src/user/user.module';
import { CommonSettingsModule } from 'src/common-settings/common-settings.module';
import { EmailNotificationModule } from '../email-notification/email-notification.module';
import { TextNotificationModule } from 'src/text-notification/text-notification.module';
import { QuoteSchema } from './models/quotes.model';
import { OrderModule } from 'src/order/order.module';
import { DbCounterModule } from 'src/db-counter/db-counter.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Quotes',
        schema: QuoteSchema,
      },
    ]),
    SqsModule.registerAsync({
      useFactory: async () => {
        const allConsumers = [];
        const allProducers = [
          queueManager.textNotification.sendQuoteConfirmationTextNotification
            .queueName,

          queueManager.emailNotification
            .sendEmailNotificationForQuoteConfirmation.queueName,
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
    OrderModule,
    UserModule,
    DbCounterModule,
    CommonSettingsModule,
    EmailNotificationModule,
    TextNotificationModule,
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [MongooseModule, QuotesService],
})
export class QuotesModule {}
