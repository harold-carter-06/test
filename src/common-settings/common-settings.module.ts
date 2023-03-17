import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { queueManager } from 'src/queue-manager/queue-manager';
import { SqsModule } from 'src/sqs-custom-module';
import { UserModule } from 'src/user/user.module';
import { CommonSettingsController } from './common-settings.controller';
import { CommonSettingsSchema } from './common-settings.model';
import { CommonSettingsService } from './common-settings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'CommonSettings',
        schema: CommonSettingsSchema,
      },
    ]),
    forwardRef(() => UserModule),
    SqsModule.registerAsync({
      useFactory: async () => {
        let allConsumers = [];
        let allProducers = [
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
  controllers: [CommonSettingsController],
  providers: [CommonSettingsService],
  exports: [MongooseModule, CommonSettingsService],
})
export class CommonSettingsModule {}
