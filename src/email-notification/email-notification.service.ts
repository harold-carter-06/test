import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SES } from 'aws-sdk';
import { sendEmailDto } from './email-notification.dto';
@Injectable()
export class EmailNotificationService {
  constructor() {}

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
  async sendSimpleEmail(sendEmailDto: sendEmailDto) {
    const {
      from,
      html_content,
      text_content,
      subject,
      reply_to_addresses,
      cc_addresses,
      to_addresses,
    } = sendEmailDto;
    try {
      const sesService = await new SES({
        region: process.env.AWS_REGION,
      });

      let emailParams = {
        Destination: {
          /* required */
          CcAddresses: cc_addresses,
          ToAddresses: to_addresses,
        },
        Message: {
          /* required */
          Body: {
            /* required */
            Html: {
              Charset: 'UTF-8',
              Data: `${html_content}`,
            },
            Text: {
              Charset: 'UTF-8',
              Data: `${text_content}`,
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: `${subject}`,
          },
        },
        Source: `${from}` /* required */,
        ReplyToAddresses: reply_to_addresses,
      };

      // Create the promise and SES service object
      let result = await sesService.sendEmail(emailParams).promise();

      return 'ok';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(
        'Something went wrong while sending email',
      );
    }
  }
}
