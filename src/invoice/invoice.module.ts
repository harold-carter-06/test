import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SqsModule } from 'src/sqs-custom-module';
import { CommonSettingsModule } from 'src/common-settings/common-settings.module';
import { CommonModule } from 'src/common/common.module';
import { queueManager } from 'src/queue-manager/queue-manager';
import { StripeConnectorModule } from 'src/stripe-connector/stripe-connector.module';
import { CustomerModule } from '../customer/customer.module';
import { DbCounterModule } from '../db-counter/db-counter.module';
import { ItemModule } from '../item/item.module';
import { OrderModule } from '../order/order.module';
import { UserModule } from '../user/user.module';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { InvoiceSchema } from './models/invoice.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Invoices',
        schema: InvoiceSchema,
      },
    ]),
    SqsModule.registerAsync({
      useFactory: async () => {
        const allConsumers = [];
        const allProducers = [
          queueManager.emailNotification.sendInvoiceEmailNotification.queueName,
          queueManager.textNotification.sendInvoiceTextNotification.queueName,
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

    CommonSettingsModule,
    ItemModule,
    StripeConnectorModule,
    DbCounterModule,
    CommonModule,
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [MongooseModule, InvoiceService],
})
export class InvoiceModule {}
