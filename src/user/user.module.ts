import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { SqsModule } from 'src/sqs-custom-module';
import { CommonSettingsModule } from 'src/common-settings/common-settings.module';
import { EmailNotificationModule } from '../email-notification/email-notification.module';
import { TextNotificationModule } from '../text-notification/text-notification.module';
import { jwtStrategy } from './main-jwt.strategy';
import { VerifyUserEmailSchema } from './models/email-verify.model';
import { UserAuthSchema } from './models/user.model';
import { UserQueueConsumer } from './queue-consumer/user-queue.consumer';
import { UserController } from './user.controller';
import { UserService } from './user.service';

import { queueManager } from 'src/queue-manager/queue-manager';

import { BackendSystemModule } from 'src/backend-system/backend-system.module';
import { ResetPasswordForUserSchema } from './models/reset-password.model';
import { UserCreditQueueConsumer } from './queue-consumer/user-credit-queue.consumer';
import { HeaderApiKeyStrategy } from './auth-header-api-key.strategy';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'main-jwt-strategy',
      apiKeyStrategy: 'api-key-strategy',
    }),
    MongooseModule.forFeature([
      {
        name: 'Users',
        schema: UserAuthSchema,
      },
      {
        name: 'VerifyUserEmail',
        schema: VerifyUserEmailSchema,
      },
      {
        name: 'ResetPasswordUser',
        schema: ResetPasswordForUserSchema,
      },
    ]),
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: process.env.JWT_SECRET,
        signOptions: {
          expiresIn: parseInt(process.env.JWT_EXPIRATION_TIME),
        },
      }),
    }),
    EmailNotificationModule,
    TextNotificationModule,
    BackendSystemModule,
    SqsModule.registerAsync({
      useFactory: async () => {
        let allConsumers = [
          queueManager.user.createNewUserAdminNotification.queueName, // name of the queue
          queueManager.user.userSignedInAdminNotification.queueName, // name of the queue
          queueManager.user.userSignedInAdminNotificationForSuperADMIN
            .queueName,
          queueManager.user.addCreditsForUser.queueName,
          queueManager.user.deductCreditsForUser.queueName,
        ];
        let allProducers = [
          queueManager.employee.createNewEmployeeEmailNotification.queueName,
          queueManager.user.createNewUserAdminNotification.queueName,
          queueManager.user.userSignedInAdminNotification.queueName,
          queueManager.emailNotification.sendEmailNotificationGeneral.queueName,
          queueManager.user.userSignedInAdminNotificationForSuperADMIN
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
    forwardRef(() => CommonSettingsModule),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    jwtStrategy,
    HeaderApiKeyStrategy,
    UserQueueConsumer,
    UserCreditQueueConsumer,
  ],
  exports: [
    PassportModule,
    jwtStrategy,
    HeaderApiKeyStrategy,
    MongooseModule,
    UserService,
  ],
})
export class UserModule {}
