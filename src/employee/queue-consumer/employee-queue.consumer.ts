import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SqsMessageHandler } from 'src/sqs-custom-module';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { sendEmailDto } from 'src/email-notification/email-notification.dto';
import { EmailNotificationService } from 'src/email-notification/email-notification.service';
import { queueManager } from 'src/queue-manager/queue-manager';
import { RoleTypes } from 'src/roles.decorator';
import { User } from 'src/user/models/user.model';
import { UserService } from 'src/user/user.service';
import { createNewEmployeeEmailNotificationType } from '../events/create-new-employee-email-notification.event';
import { createNewEmployeeGenerateAccountType } from '../events/create-new-employee-generate-account.event';
import { Employee } from '../models/employee.model';

@Injectable()
export class EmployeeQueueConsumer {
  constructor(
    @InjectModel('Employees') private employeeModel: Model<Employee>,
    private userService: UserService,
    private emailNotificationService: EmailNotificationService,
  ) {}
  @SqsMessageHandler(
    `${queueManager.employee.createNewEmployeeEmailNotification.queueName}`,
    false,
  )
  async handleMessageForNewEmployeeEmailNotification(message: AWS.SQS.Message) {
    const obj: createNewEmployeeEmailNotificationType = JSON.parse(
      message.Body,
    );
    console.log(obj);
    console.log('message recieved');
    try {
      const emailData: sendEmailDto = {
        from: process.env.SYSTEM_NOTIFY_EMAIL_ADDRESS,
        html_content: `<p>
          Your username: ${obj.email} <br />
          & Your password: ${obj.password} <br />
          Join this link: ${process.env.FRONT_END_URL} <br />
        </p>`,
        text_content: `Join ServiceBuddy`,
        subject: `${obj.companyName} invited you to join ServiceBuddy`,
        reply_to_addresses: [],
        cc_addresses: [],
        to_addresses: [`${obj.email}`],
      };
      const sendEmailToNewUser =
        await this.emailNotificationService.sendSimpleEmail(emailData);
      console.log('email sent');
    } catch (emailErr) {
      console.log(
        'Something went wrong while sending invite email for employee.',
      );
    }
  }

  @SqsMessageHandler(
    `${queueManager.employee.createNewEmployeeGenerateAccount.queueName}`,
    false,
  )
  async handleMessageForNewEmployeeAccountGeneration(message: AWS.SQS.Message) {
    const obj: createNewEmployeeGenerateAccountType = JSON.parse(message.Body);
    console.log('message recieved');
    const createAccount = await this.userService.staffSignUp(obj.domain, obj);
    console.log('account created');
  }
}
