import { Injectable, NotFoundException } from '@nestjs/common';
import { SqsMessageHandler, SqsService } from 'src/sqs-custom-module';
import * as moment from 'moment';
import { SlackNotificationService } from 'src/backend-system/slack-notification.service';
import { queueManager } from 'src/queue-manager/queue-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommonSettings } from 'src/common-settings/common-settings.model';
import { DeductCreditsEvent } from '../events/deduct-credits.event';
import { createNewActivityEvent } from 'src/activity/events/create-new-activity.event';
import { ActivityTypes } from 'src/activity/activity.types';
import { randomUUID } from 'crypto';

@Injectable()
export class UserCreditQueueConsumer {
  constructor(
    @InjectModel('CommonSettings')
    private commonSettingsModel: Model<CommonSettings>,
    private sqsService: SqsService,
  ) {}

  @SqsMessageHandler(`${queueManager.user.addCreditsForUser.queueName}`, false)
  async handleAddCredits(message: AWS.SQS.Message) {
    const obj: any = JSON.parse(message.Body);
  }

  @SqsMessageHandler(
    `${queueManager.user.deductCreditsForUser.queueName}`,
    false,
  )
  async handleDeductCredits(message: AWS.SQS.Message) {
    const obj: DeductCreditsEvent = JSON.parse(message.Body);

    try {
      const findCommonSettings = await this.commonSettingsModel.findOne({
        domain: obj.domain,
      });
      if (!findCommonSettings) {
        throw new NotFoundException('user not found');
      }

      findCommonSettings.available_credits =
        findCommonSettings.available_credits - obj.credits > 0
          ? findCommonSettings.available_credits - obj.credits
          : 0;
      await findCommonSettings.save();
      const newActivityEvent: createNewActivityEvent = {
        created_by_user_id: findCommonSettings.root_user_id,
        activity_name: 'Deducted Credits',
        desc: `Deduct ${obj.credits} credit(s) from account for ${obj.deductReason}`,
        activity_type: ActivityTypes.UserCredit.events.DEDUCT_CREDITS,
        collection_name: 'USER',
        document_id: null,
        action_link: '',
        domain: obj.domain,
      };
      const sendToQueue = await this.sqsService.send(
        `${queueManager.activity.createActivityEvent.queueName}`,
        {
          id: `${randomUUID()}`,
          body: newActivityEvent,
        },
      );
    } catch (err) {
      console.log(err);
    }
  }
}
