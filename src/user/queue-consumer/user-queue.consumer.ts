import { Injectable } from '@nestjs/common';
import { SqsMessageHandler } from 'src/sqs-custom-module';
import * as moment from 'moment';
import { SlackNotificationService } from 'src/backend-system/slack-notification.service';
import { queueManager } from 'src/queue-manager/queue-manager';

@Injectable()
export class UserQueueConsumer {
  constructor(private slackNotificationService: SlackNotificationService) {}
  @SqsMessageHandler(
    `${queueManager.user.createNewUserAdminNotification.queueName}`,
    false,
  )
  async handleMessageForUserSignup(message: AWS.SQS.Message) {
    const obj: any = JSON.parse(message.Body);
    console.log('message recieved');
    await this.slackNotificationService.sendMessageToSlack(`User SignUp In: 
    email: ${obj.email},
    domain: ${obj.domain},
    timestamp: ${moment.unix(obj.createdAt).format('DD-MM-YYYY HH:mm:ss A')}`);
  }

  @SqsMessageHandler(
    `${queueManager.user.userSignedInAdminNotification.queueName}`,
    false,
  )
  async handleMessageForUserSignin(message: AWS.SQS.Message) {
    const obj: any = JSON.parse(message.Body);
    console.log('message recieved');
    await this.slackNotificationService.sendMessageToSlack(`User SignIn: 
   email: ${obj.email},
   domain: ${obj.domain},
   timestamp: ${moment.unix(obj.createdAt).format('DD-MM-YYYY HH:mm:ss A')}`);
  }
  @SqsMessageHandler(
    `${queueManager.user.userSignedInAdminNotificationForSuperADMIN.queueName}`,
    false,
  )
  async handleMessageForUserSigninBySuperAdmin(message: AWS.SQS.Message) {
    const obj: any = JSON.parse(message.Body);
    console.log('message recieved');
    await this.slackNotificationService
      .sendMessageToSlack(`<WARNING> User SignIn via ADMIN TOKEN: 
   email: ${obj.email},
   domain: ${obj.domain},
   timestamp: ${moment.unix(obj.createdAt).format('DD-MM-YYYY HH:mm:ss A')}`);
  }
}
