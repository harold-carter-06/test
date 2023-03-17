import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/guards/roles.guard';
import { queueManager } from 'src/queue-manager/queue-manager';
import { requestManager } from 'src/request-manager/request-manager';
import { Roles } from 'src/roles.decorator';
import { GetUser } from 'src/user/get-user.decorator';
import { User } from 'src/user/models/user.model';
import { ActivityService } from './activity.service';
import { Activity } from './model/activity.model';

@Controller(requestManager.activity.controllerPath)
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get(requestManager.activity.methods.getAllActivities.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.activity.methods.getAllActivities.roles)
  async getAllActivity(@GetUser() user: User): Promise<Activity[]> {
    return await this.activityService.getAllActivity(user);
  }

  @Get(requestManager.activity.methods.getAllActivitiesForReviewRequest.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.activity.methods.getAllActivitiesForReviewRequest.roles)
  async getAllReviewRequestActivities(
    @GetUser() user: User,
  ): Promise<Activity[]> {
    return await this.activityService.getReviewRequestActivitiesOnly(user);
  }
}
