import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CommonService {
  async getShortURL(long_url): Promise<string> {
    try {
      const createShortURL = await axios.post('https://sbdy.link/links', {
        long_url,
      });
      if (
        createShortURL &&
        createShortURL.data &&
        createShortURL.data.unique_key
      ) {
        return `https://sbdy.link/${createShortURL.data.unique_key}`;
      } else {
        return long_url;
      }
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('could not get short url');
    }
  }
}
