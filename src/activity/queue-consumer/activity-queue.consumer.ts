import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SqsMessageHandler } from 'src/sqs-custom-module';
import { Model } from 'mongoose';
import { queueManager } from 'src/queue-manager/queue-manager';
import { createNewActivityEvent } from '../events/create-new-activity.event';
import { Activity } from '../model/activity.model';
import moment from 'moment';
@Injectable()
export class ActivityQueueConsumer {
  constructor(
    @InjectModel('Activity') private activityModel: Model<Activity>,
  ) {}

  @SqsMessageHandler(
    `${queueManager.activity.createActivityEvent.queueName}`,
    false,
  )
  async handleActivityEventCreation(message: AWS.SQS.Message) {
    const obj: createNewActivityEvent = JSON.parse(message.Body);
    console.log(obj);
    console.log('message recieved');
    try {
      const createNewActivity = new this.activityModel();

      createNewActivity.created_by_user_id = obj.created_by_user_id;
      createNewActivity.activity_name = obj.activity_name;
      createNewActivity.desc = obj.desc;
      createNewActivity.activity_type = obj.activity_type;
      createNewActivity.action_link = obj.action_link;
      createNewActivity.created_at = moment().unix();
      createNewActivity.updated_at = moment().unix();
      createNewActivity.domain = obj.domain;
      await createNewActivity.save();
      console.log('Activty saved');
    } catch (err) {
      console.log(err);
      console.log('Something went wrong while creating activity event.');
    }
  }
}
