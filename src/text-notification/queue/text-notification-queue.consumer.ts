import { Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { queueManager } from 'src/queue-manager/queue-manager';
import { SqsMessageHandler } from 'src/sqs-custom-module';
import { generateTextTemplateForBookingConfirmation } from 'src/text-template/booking-confirmation-text-template';
import { sendBookingConfirmationSMSType } from '../events/send-sms-booking-confirmation.event';
import { sendEstimateReadySMSType } from '../events/send-sms-estimate-ready.event';
import { sendReviewRequestTextSMSType } from '../events/send-sms-for-review.event';
import { sendInvoiceReadySMSType } from '../events/send-sms-invoice-ready.event';
import { TextNotificationService } from '../text-notification.service';

@Injectable()
export class TextNotificationQueueConsumer {
  constructor(
    private textNotificationService: TextNotificationService,
    private commonService: CommonService,
  ) {}

  @SqsMessageHandler(
    `${queueManager.textNotification.sendBookingConfirmationTextNotification.queueName}`,
    false,
  )
  async handleMessageForBookingConfirmationTextNotification(
    message: AWS.SQS.Message,
  ) {
    const obj: sendBookingConfirmationSMSType = JSON.parse(message.Body);
    console.log(obj);
    console.log('message recieved');
    try {
      const content = generateTextTemplateForBookingConfirmation(
        obj.companyName,
        obj.bookingRefId,
      );
      const sendTextToUser = await this.textNotificationService.sendSMS(
        obj.to_phone_number,
        content,
        obj.domain,
      );
      console.log('text sent');
    } catch (textErr) {
      console.log('Something went wrong while sending invite Text.');
    }
  }
  @SqsMessageHandler(
    `${queueManager.textNotification.sendInvoiceTextNotification.queueName}`,
    false,
  )
  async handleMessageForInvoiceTextNotification(message: AWS.SQS.Message) {
    const obj: sendInvoiceReadySMSType = JSON.parse(message.Body);
    console.log(obj);
    console.log('message recieved');
    try {
      const getUniqueURL = await this.commonService.getShortURL(
        obj.invoice_link,
      );
      const content = this.textNotificationService.convertedStringForInvoice(
        obj.textTemplate,

        obj.customer_first_name,
        obj.customer_last_name,
        obj.invoice_ref_id,
        obj.customer_email,
        obj.to_phone_number,
        getUniqueURL,
      );
      const sendTextToUser = await this.textNotificationService.sendSMS(
        obj.to_phone_number,
        content,
        obj.domain,
      );
      console.log('text sent');
    } catch (textErr) {
      console.log('Something went wrong while sending invite Text.');
    }
  }

  @SqsMessageHandler(
    `${queueManager.textNotification.sendEstimateTextNotification.queueName}`,
    false,
  )
  async handleMessageForEstimateTextNotification(message: AWS.SQS.Message) {
    const obj: sendEstimateReadySMSType = JSON.parse(message.Body);
    console.log(obj);
    console.log('message recieved');

    try {
      const getUniqueURL = await this.commonService.getShortURL(
        obj.estimate_link,
      );
      const content = this.textNotificationService.convertedStringForEstimate(
        obj.textTemplate,
        obj.customer_first_name,
        obj.customer_last_name,
        obj.estimate_ref_id,
        obj.customer_email,
        obj.to_phone_number,
        getUniqueURL,
      );
      const sendTextToUser = await this.textNotificationService.sendSMS(
        obj.to_phone_number,
        content,
        obj.domain,
      );
      console.log('text sent');
    } catch (textErr) {
      console.log('Something went wrong while sending invite Text.');
    }
  }

  @SqsMessageHandler(
    `${queueManager.textNotification.sendReviewRequestTextNotification.queueName}`,
    false,
  )
  async handleMessageForReviewRequestTextNotification(
    message: AWS.SQS.Message,
  ) {
    const obj: sendReviewRequestTextSMSType = JSON.parse(message.Body);
    console.log(obj);
    console.log('message recieved');
    try {
      const sendTextToUser = await this.textNotificationService.sendSMS(
        obj.to_phone_number,
        obj.text,
        obj.domain,
      );
      console.log('text sent');
    } catch (textErr) {
      console.log('Something went wrong while sending invite Text.');
    }
  }
}
