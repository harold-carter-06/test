import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SqsModule } from 'src/sqs-custom-module';
import { EmailNotificationModule } from 'src/email-notification/email-notification.module';
import { queueManager } from 'src/queue-manager/queue-manager';
import { UserModule } from '../user/user.module';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeSchema } from './models/employee.model';
import { EmployeeQueueConsumer } from './queue-consumer/employee-queue.consumer';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Employees',
        schema: EmployeeSchema,
      },
    ]),
    UserModule,
    EmailNotificationModule,
    SqsModule.registerAsync({
      useFactory: async () => {
        let allConsumers = [
          queueManager.employee.createNewEmployeeEmailNotification.queueName,
          queueManager.employee.createNewEmployeeGenerateAccount.queueName,
        ];
        let allProducers = [
          queueManager.employee.createNewEmployeeEmailNotification.queueName,
          queueManager.employee.createNewEmployeeGenerateAccount.queueName,
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
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeQueueConsumer],

  exports: [MongooseModule, EmployeeService],
})
export class EmployeeModule {}
