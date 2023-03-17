import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/guards/roles.guard';
import { queueManager } from 'src/queue-manager/queue-manager';
import { requestManager } from 'src/request-manager/request-manager';
import { Roles } from 'src/roles.decorator';
import { GetUser } from 'src/user/get-user.decorator';
import { User } from 'src/user/models/user.model';
import { sendReviewRequestDto } from './dto/send-review-request.dto';
import { ReviewService } from './review.service';

@Controller(requestManager.review.controllerPath)
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Post(requestManager.review.methods.sendReviewRequest.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.review.methods.sendReviewRequest.roles)
  async sendReviewRequest(
    @GetUser() user: User,
    @Body(ValidationPipe) sendReviewRequestDataDto: sendReviewRequestDto,
  ): Promise<string> {
    return await this.reviewService.sendReviewRequest(
      user,
      sendReviewRequestDataDto,
    );
  }
}
