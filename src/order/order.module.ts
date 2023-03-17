import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DbCounterModule } from '../db-counter/db-counter.module';
import { CustomerModule } from '../customer/customer.module';
import { ItemModule } from '../item/item.module';
import { UserModule } from '../user/user.module';
import { OrderSchema } from './models/order.model';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { EmailNotificationModule } from '../email-notification/email-notification.module';
import { TaskModule } from 'src/task/task.module';
import { CommonSettingsModule } from 'src/common-settings/common-settings.module';
import { TextNotificationModule } from 'src/text-notification/text-notification.module';
import { SqsModule } from 'src/sqs-custom-module';
import { queueManager } from 'src/queue-manager/queue-manager';
import { EmployeeOrderSchema } from './models/employeeOrder.model';
import { InvoiceSchema } from 'src/invoice/models/invoice.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Orders',
        schema: OrderSchema,
      },
      {
        name: 'EmployeeOrders',
        schema: EmployeeOrderSchema,
      },
      {
        name: 'Invoices',
        schema: InvoiceSchema,
      },
    ]),
    SqsModule.registerAsync({
      useFactory: async () => {
        const allConsumers = [];
        const allProducers = [
          queueManager.textNotification.sendInvoiceTextNotification.queueName,
          queueManager.textNotification.sendBookingConfirmationTextNotification
            .queueName,
          queueManager.emailNotification
            .sendEmailNotificationForBookingConfirmation.queueName,
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
    UserModule,
    CommonSettingsModule,
    ItemModule,
    TaskModule,
    DbCounterModule,
    EmailNotificationModule,
    TextNotificationModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [MongooseModule, OrderService],
})
export class OrderModule {}
