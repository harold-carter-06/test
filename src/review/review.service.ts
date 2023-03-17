import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { ActivityTypes } from 'src/activity/activity.types';
import { createNewActivityEvent } from 'src/activity/events/create-new-activity.event';
import { sendReviewRequestEmailType } from 'src/email-notification/events/send-review-email.event';
import { queueManager } from 'src/queue-manager/queue-manager';
import { SqsService } from 'src/sqs-custom-module';
import { sendReviewRequestTextSMSType } from 'src/text-notification/events/send-sms-for-review.event';
import { TextNotificationService } from 'src/text-notification/text-notification.service';
import { User } from 'src/user/models/user.model';
import { sendReviewRequestDto } from './dto/send-review-request.dto';

@Injectable()
export class ReviewService {
  constructor(
    private sqsService: SqsService,
    @InjectModel('Users') private userModel: Model<User>,
  ) {}

  async sendReviewRequest(user: User, reviewRequest: sendReviewRequestDto) {
    const {
      name,
      email,
      phone,
      sms_content,
      email_content,
      companyName,
      send_sms,
      send_email,
    } = reviewRequest;
    const findUser = await this.userModel.findOne({
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('user not found');
    }
    if (send_sms) {
      const sendReviewRequestSMS: sendReviewRequestTextSMSType = {
        to_phone_number: phone,
        domain: findUser.domain,
        text: sms_content,
      };
      try {
        const sendToQueue = await this.sqsService.send(
          `${queueManager.textNotification.sendReviewRequestTextNotification.queueName}`,
          {
            id: `${randomUUID()}`,
            body: sendReviewRequestSMS,
          },
        );
      } catch (textErr) {
        console.log(textErr);
        console.log(
          'Error while creating queue event for text booking confirmation',
        );
      }
      try {
        const createNewActivity: createNewActivityEvent = {
          created_by_user_id: findUser._id,
          activity_name: 'Review Request Sent via SMS',
          desc: `Review request sent to ${name} via SMS`,
          activity_type: ActivityTypes.Review.events.SEND_REVIEW_REQUEST,
          collection_name: ActivityTypes.Review.name,
          document_id: null,
          action_link: ``,
          domain: findUser.domain,
        };
        const sendToQueue = await this.sqsService.send(
          `${queueManager.activity.createActivityEvent.queueName}`,
          {
            id: `${randomUUID()}`,
            body: createNewActivity,
          },
        );
      } catch (err) {
        console.log('Error while creating queue event for activity');
      }
    }
    if (send_email) {
      const sendReviewRequestEmail: sendReviewRequestEmailType = {
        from_email: process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,

        to_email: email,
        domain: findUser.domain,
        email_content: sms_content,
        companyName: companyName,
      };
      try {
        const sendToQueue = await this.sqsService.send(
          `${queueManager.emailNotification.sendReviewRequestEmailNotification.queueName}`,
          {
            id: `${randomUUID()}`,
            body: sendReviewRequestEmail,
          },
        );
      } catch (textErr) {
        console.log(textErr);
        console.log(
          'Error while creating queue event for text booking confirmation',
        );
      }
      try {
        const createNewActivity: createNewActivityEvent = {
          created_by_user_id: findUser._id,
          activity_name: 'Review Request Sent via Email',
          desc: `Review request sent to ${name} via Email`,
          activity_type: ActivityTypes.Review.events.SEND_REVIEW_REQUEST,
          collection_name: ActivityTypes.Review.name,
          document_id: null,
          action_link: ``,
          domain: findUser.domain,
        };
        const sendToQueue = await this.sqsService.send(
          `${queueManager.activity.createActivityEvent.queueName}`,
          {
            id: `${randomUUID()}`,
            body: createNewActivity,
          },
        );
      } catch (err) {
        console.log('Error while creating queue event for activity');
      }
    }
    return 'ok';
  }
}
