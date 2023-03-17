import { Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { booking_email_content } from 'src/email-templates/booking-confirmation-email';
import { queueManager } from 'src/queue-manager/queue-manager';
import { SqsMessageHandler } from 'src/sqs-custom-module';
import { sendEmailDto } from '../email-notification.dto';
import { EmailNotificationService } from '../email-notification.service';
import { sendBookingConfirmationEmailType } from '../events/send-booking-confirmation-email.event';
import { sendEmailNotificationGeneralType } from '../events/send-email-notification-general.event';
import { sendestimateEmailType } from '../events/send-estimate-email.event';
import { sendInvoiceEmailType } from '../events/send-invoice-email.event';
import { sendReviewRequestEmailType } from '../events/send-review-email.event';

@Injectable()
export class EmailNotificationQueueConsumer {
  constructor(
    private emailNotificationService: EmailNotificationService,
    private commonService: CommonService,
  ) {}
  @SqsMessageHandler(
    `${queueManager.emailNotification.sendEmailNotificationGeneral.queueName}`,
    false,
  )
  async handleMessageForEmailNotificationGeneral(message: AWS.SQS.Message) {
    const obj: sendEmailNotificationGeneralType = JSON.parse(message.Body);
    console.log(obj);
    console.log('message recieved');
    try {
      const emailData: sendEmailDto = {
        from: obj.from_email,
        html_content: `${obj.content}`,
        text_content: ``,
        subject: `${obj.email_subject}`,
        reply_to_addresses: [],
        cc_addresses: [],
        to_addresses: [`${obj.to_email}`],
      };
      const sendEmailToNewUser =
        await this.emailNotificationService.sendSimpleEmail(emailData);
      console.log('email sent');
    } catch (emailErr) {
      console.log('Something went wrong while sending email.');
    }
  }
  @SqsMessageHandler(
    `${queueManager.emailNotification.sendEmailNotificationForBookingConfirmation.queueName}`,
    false,
  )
  async handleMessageForEmailBookingConfirmationNotificationGeneral(
    message: AWS.SQS.Message,
  ) {
    const obj: sendBookingConfirmationEmailType = JSON.parse(message.Body);
    console.log(obj);
    console.log('message recieved');
    try {
      const contentOfEmail = `${booking_email_content(
        obj.companyName,
        obj.companyLogo,
        obj.companyEmail,
        obj.bookingRefId,
      )}`;

      const emailData: sendEmailDto = {
        from: obj.from_email,
        html_content: `${contentOfEmail}`,
        text_content: ``,
        subject: `Booking confirmation with ${obj.companyName}.`,
        reply_to_addresses: [],
        cc_addresses: [],
        to_addresses: [`${obj.to_email}`],
      };
      const sendEmailToNewUser =
        await this.emailNotificationService.sendSimpleEmail(emailData);
      console.log('email sent');
    } catch (emailErr) {
      console.log('Something went wrong while sending booking email.');
    }
  }
  @SqsMessageHandler(
    `${queueManager.emailNotification.sendInvoiceEmailNotification.queueName}`,
    false,
  )
  async handleMessageForInvoiceNotificationGeneral(message: AWS.SQS.Message) {
    const obj: sendInvoiceEmailType = JSON.parse(message.Body);
    console.log(obj);
    console.log('message recieved');
    try {
      const getUniqueURL = await this.commonService.getShortURL(
        obj.invoice_link,
      );

      const content = this.emailNotificationService.convertedStringForInvoice(
        obj.textTemplate,
        obj.customer_first_name,
        obj.customer_last_name,
        obj.invoice_ref_id,
        obj.customer_email,
        obj.to_phone_number,
        getUniqueURL,
      );

      const emailData: sendEmailDto = {
        from: obj.from_email,
        html_content: `${content}`,
        text_content: ``,
        subject: `Invoice recieved from ${obj.companyName}.`,
        reply_to_addresses: [],
        cc_addresses: [],
        to_addresses: [`${obj.customer_email}`],
      };
      const sendEmailToNewUser =
        await this.emailNotificationService.sendSimpleEmail(emailData);
      console.log('email sent');
    } catch (emailErr) {
      console.log('Something went wrong while sending invoice email.');
    }
  }

  @SqsMessageHandler(
    `${queueManager.emailNotification.sendEstimateEmailNotification.queueName}`,
    false,
  )
  async handleMessageForEstimateNotificationGeneral(message: AWS.SQS.Message) {
    const obj: sendestimateEmailType = JSON.parse(message.Body);
    console.log(obj);
    console.log('message recieved');

    try {
      const getUniqueURL = await this.commonService.getShortURL(
        obj.estimate_link,
      );
      const content = this.emailNotificationService.convertedStringForEstimate(
        obj.textTemplate,
        obj.customer_first_name,
        obj.customer_last_name,
        obj.estimate_ref_id,
        obj.customer_email,
        obj.to_phone_number,
        getUniqueURL,
      );

      const emailData: sendEmailDto = {
        from: obj.from_email,
        html_content: `${content}`,
        text_content: ``,
        subject: `Estimate recieved from ${obj.companyName}.`,
        reply_to_addresses: [],
        cc_addresses: [],
        to_addresses: [`${obj.customer_email}`],
      };
      const sendEmailToNewUser =
        await this.emailNotificationService.sendSimpleEmail(emailData);
      console.log('email sent');
    } catch (emailErr) {
      console.log('Something went wrong while sending estimate email.');
    }
  }

  @SqsMessageHandler(
    `${queueManager.emailNotification.sendReviewRequestEmailNotification.queueName}`,
    false,
  )
  async handleMessageForReviewRequestEmailNotification(
    message: AWS.SQS.Message,
  ) {
    const obj: sendReviewRequestEmailType = JSON.parse(message.Body);
    console.log(obj);
    console.log('message recieved');

    try {
      const emailData: sendEmailDto = {
        from: obj.from_email,
        html_content: `${obj.email_content}`,
        text_content: ``,
        subject: `Leave feedback for ${obj.companyName} .`,
        reply_to_addresses: [],
        cc_addresses: [],
        to_addresses: [`${obj.to_email}`],
      };
      const sendEmailToNewUser =
        await this.emailNotificationService.sendSimpleEmail(emailData);
      console.log('email sent');
    } catch (emailErr) {
      console.log('Something went wrong while sending estimate email.');
    }
  }
}
