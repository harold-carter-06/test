import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Request, Response } from 'express';
import { Model } from 'mongoose';
import { User } from '../user/models/user.model';

@Injectable()
export class DynamicSiteLoaderService {
  constructor(@InjectModel('Users') private userModel: Model<User>) {}
  async getWebsite(req: Request, res: Response): Promise<string> {
    let temp = req.hostname;
    const userDomain = temp.split('.');
    if (!userDomain && !userDomain[0]) {
      res.status(400).send('No Such domain');
      return 'ok';
    } else {
      const findUserInfo = await this.userModel.findOne({
        domain: userDomain[0],
        main_account_owner: true,
      });
      if (!findUserInfo) {
        res.status(400).send('No Such domain');
        return 'ok';
      }
      const result = await axios.get('https://example.com/');
      res.send(result.data).status(400);
      return 'ok';
    }
  }
}
