import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { stringMap } from 'aws-sdk/clients/backup';
import { Model } from 'mongoose';
import { CommonSettings } from 'src/common-settings/common-settings.model';
import { SqsService } from 'src/sqs-custom-module';
import { DeductCreditsEvent } from 'src/user/events/deduct-credits.event';
import twilioClient from 'twilio';
import moment from 'moment';
import { queueManager } from 'src/queue-manager/queue-manager';
import { randomUUID } from 'crypto';
@Injectable()
export class TextNotificationService {
  constructor(
    @InjectModel('CommonSettings')
    private commonSettingsModel: Model<CommonSettings>,
    private sqsService: SqsService,
  ) {}

  async requestPhoneVerification(phone_number: string) {
    try {
      const accountSid = `${process.env.TWILIO_ACCOUNT_SID}`;
      const authToken = `${process.env.TWILIO_ACCOUNT_AUTH_TOKEN}`;
      const twilioClientAccount = twilioClient(accountSid, authToken);
      const sendCode = await twilioClientAccount.verify
        .services(`${process.env.TWILIO_ACCOUNT_SEVICE_ID}`)
        .verifications.create({
          to: `+${phone_number.replace('+', '')}`,
          channel: 'sms',
        });
      return 'ok';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async verifyPhoneCode(phone_number: string, code: string) {
    try {
      const accountSid = `${process.env.TWILIO_ACCOUNT_SID}`;
      const authToken = `${process.env.TWILIO_ACCOUNT_AUTH_TOKEN}`;
      const twilioClientAccount = twilioClient(accountSid, authToken);
      const verify = await twilioClientAccount.verify
        .services(`${process.env.TWILIO_ACCOUNT_SEVICE_ID}`)
        .verificationChecks.create({
          to: `+${phone_number.replace('+', '')}`,
          code: `${code}`,
        });
      return 'ok';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('while verifying code');
    }
  }

  convertedStringForEstimate(
    textTemplate: string,
    first_name: string,
    last_name: string,
    seq_id: string,
    email: string,
    phone: string,
    link: string,
  ): string {
    const stringParse = textTemplate;

    const replacements: any = {
      customer_first_name: first_name,
      estimate_ref_id: seq_id,
      customer_last_name: last_name,
      customer_email: email,
      phone: phone,
      estimate_link: link,
    };
    const formattedText = stringParse.replace(
      /{{(\w+)}}/g,
      (placeholderWithDelimiters, placeholderWithoutDelimiters) =>
        replacements.hasOwnProperty(placeholderWithoutDelimiters)
          ? replacements[placeholderWithoutDelimiters]
          : placeholderWithDelimiters,
    );
    return formattedText;
  }
  convertedStringForInvoice(
    textTemplate: string,
    first_name: string,
    last_name: string,
    seq_id: string,
    email: string,
    phone: string,
    link: string,
  ): string {
    const stringParse = textTemplate;

    const replacements: any = {
      customer_first_name: first_name,
      invoice_ref_id: seq_id,
      customer_last_name: last_name,
      customer_email: email,
      phone: phone,
      invoice_link: link,
    };
    const formattedText = stringParse.replace(
      /{{(\w+)}}/g,
      (placeholderWithDelimiters, placeholderWithoutDelimiters) =>
        replacements.hasOwnProperty(placeholderWithoutDelimiters)
          ? replacements[placeholderWithoutDelimiters]
          : placeholderWithDelimiters,
    );
    return formattedText;
  }

  async sendSMS(to_phone_number: string, body: string, domain: string) {
    try {
      const accountSid = `${process.env.TWILIO_ACCOUNT_SID}`;
      const authToken = `${process.env.TWILIO_ACCOUNT_AUTH_TOKEN}`;
      const twilioClientAccount = twilioClient(accountSid, authToken);
      const params: any = {
        body: body,
        to: to_phone_number,
        messagingServiceSid: `${process.env.TWILIO_ACCOUNT_MESSAGES_SEVICE_ID}`,
        ShortenUrl: true,
      };
      const findCommonSettingsForDomain =
        await this.commonSettingsModel.findOne({
          domain,
        });
      if (!findCommonSettingsForDomain) {
        throw new NotFoundException('Settings not found');
      }
      if (!(findCommonSettingsForDomain.available_credits > 0)) {
        throw new UnprocessableEntityException('Not Enough credits');
      }
      const sendSMS = await twilioClientAccount.messages.create(params);
      try {
        const createCreditDeductionEvent: DeductCreditsEvent = {
          domain: domain,
          createdAt: moment().unix(),
          credits: 1,
          deductReason: '1 SMS to customer',
        };
        const sendToQueue = await this.sqsService.send(
          `${queueManager.user.deductCreditsForUser.queueName}`,
          {
            id: `${randomUUID()}`,
            body: createCreditDeductionEvent,
          },
        );
      } catch (err) {
        console.log(err);
      }
      console.log(`SMS Sent to: ${to_phone_number}`);

      return 'ok';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(
        'Could not send Message Notification',
      );
    }
  }
}
