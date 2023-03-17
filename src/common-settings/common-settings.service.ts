import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommonSettings } from './common-settings.model';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from 'src/user/models/user.model';
import { createNewActivityEvent } from 'src/activity/events/create-new-activity.event';
import { ActivityTypes } from 'src/activity/activity.types';
import { SqsService } from 'src/sqs-custom-module';
import { randomUUID } from 'crypto';
import { queueManager } from 'src/queue-manager/queue-manager';

@Injectable()
export class CommonSettingsService {
  constructor(
    @InjectModel('CommonSettings')
    private commonSettingsModel: Model<CommonSettings>,
    @InjectModel('Users')
    private userModel: Model<User>,
    private sqsService: SqsService,
  ) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleEmployeeCreditDeduction() {
    const findAllCommonSettings = await this.commonSettingsModel.find({});
    for (let i = 0; i < findAllCommonSettings.length; i++) {
      try {
        const elem = findAllCommonSettings[i];
        const getTotalUsers = await this.userModel.find({
          domain: elem.domain,
          main_account_owner: false,
        });

        const credits_to_deduct = getTotalUsers.length * 100;
        const final_credits =
          elem.available_credits - credits_to_deduct > 0
            ? elem.available_credits - credits_to_deduct
            : 0;
        const findAndUpdate = await this.commonSettingsModel.findOneAndUpdate(
          {
            _id: elem._id,
          },
          {
            available_credits: final_credits,
          },
        );
        console.log('user updated');
        const newActivityEvent: createNewActivityEvent = {
          created_by_user_id: elem.root_user_id,
          activity_name: 'Deducted Credits',
          desc: `Deduct ${credits_to_deduct} credit(s) from account for Monthly Usage of (${getTotalUsers.length}) users.`,
          activity_type: ActivityTypes.UserCredit.events.DEDUCT_CREDITS,
          collection_name: 'USER',
          document_id: null,
          action_link: '',
          domain: elem.domain,
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
}
