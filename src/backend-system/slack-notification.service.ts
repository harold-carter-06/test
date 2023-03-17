import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SlackNotificationService {
  async sendMessageToSlack(message: string) {
    try {
      const data = `${message}`;
      const payload = {
        attachments: [{ text: data, color: 'green' }],
      };
      const options = {
        method: 'post',
        baseURL: `${process.env.SLACK_WEBHOOK_URL}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        data: payload,
      };
      await axios.request(options);
    } catch (e) {
      const status = e.response.status;
      console.error(`There was an error, HTTP status code: ${status}`);
    }
  }
}
