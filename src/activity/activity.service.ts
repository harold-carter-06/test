import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/models/user.model';
import { ActivityTypes } from './activity.types';
import { Activity } from './model/activity.model';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel('Activity') private activityModel: Model<Activity>,
    @InjectModel('Users') private userModel: Model<User>,
  ) {}

  async getAllActivity(user: User): Promise<Activity[]> {
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException(`User Not Found`);
    }
    try {
      const getAllActivity = await this.activityModel
        .find({
          domain: findUser.domain,
          created_by_user_id: findUser._id,
        })
        .sort({ created_at: 'desc' })
        .limit(10);
      return getAllActivity;
    } catch (err) {
      throw new InternalServerErrorException('Something went wrong.');
    }
  }
  async getReviewRequestActivitiesOnly(user: User): Promise<Activity[]> {
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException(`User Not Found`);
    }
    try {
      const getAllActivity = await this.activityModel
        .find({
          domain: findUser.domain,
          activity_type: ActivityTypes.Review.events.SEND_REVIEW_REQUEST,
        })
        .sort({ created_at: 'desc' })
        .limit(10);
      return getAllActivity;
    } catch (err) {
      throw new InternalServerErrorException('Something went wrong.');
    }
  }
}
