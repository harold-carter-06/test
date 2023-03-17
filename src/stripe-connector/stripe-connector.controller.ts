import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  RawBodyRequest,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RolesGuard } from 'src/guards/roles.guard';
import { requestManager } from 'src/request-manager/request-manager';
import { Roles } from 'src/roles.decorator';
import { GetUser } from 'src/user/get-user.decorator';
import { User } from 'src/user/models/user.model';
import { StripeConnectorService } from './stripe-connector.service';
import { subscriptionDto, getAllPaymentsParamsDTO } from './dto/all-dto';

@Controller(requestManager.stripeConnector.controllerPath)
export class StripeConnectorController {
  constructor(private stripeConnectorService: StripeConnectorService) {}

  @Get(requestManager.stripeConnector.methods.onboardToStripeConnect.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.stripeConnector.methods.onboardToStripeConnect.roles)
  async onboardMainAccountToStripeConnect(
    @GetUser() user: User,
  ): Promise<string> {
    return await this.stripeConnectorService.onboarduserAsStripConnectAccount(
      user,
    );
  }

  @Get(requestManager.stripeConnector.methods.getCustomerPortalLink.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.stripeConnector.methods.getCustomerPortalLink.roles)
  async getStripeCustomerPortalLink(@GetUser() user: User): Promise<string> {
    return await this.stripeConnectorService.getStripeCustomerPortalLink(user);
  }

  @Post(requestManager.stripeConnector.methods.buyCredits.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.stripeConnector.methods.buyCredits.roles)
  async buyCredits(
    @GetUser() user: User,
    @Body('amount') amount: string,
    @Body('credits') credits: number,
  ): Promise<string> {
    return await this.stripeConnectorService.buyCredits(user, amount, credits);
  }

  @Post(
    requestManager.stripeConnector.methods.stripeWebhookForConnectedAccounts
      .path,
  )
  async stripeWebhookForConnectedAccounts(
    @Req() req: RawBodyRequest<Request>,
  ): Promise<string> {
    return await this.stripeConnectorService.stripeWebhookForConnectedAccounts(
      req,
    );
  }
  @Post(
    requestManager.stripeConnector.methods.stripeWebhookForPlatformAccounts
      .path,
  )
  async stripeWebhookForPlatformAccounts(
    @Req() req: RawBodyRequest<Request>,
  ): Promise<string> {
    return await this.stripeConnectorService.stripeWebhookForPlatformAccounts(
      req,
    );
  }

  @Get('/manual')
  async ManualStripVerification() {
    await this.stripeConnectorService.verifyStripeSessionsManually();
    return 'ok';
  }

  @Post(requestManager.stripeConnector.methods.stripeSubscription.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.stripeConnector.methods.stripeSubscription.roles)
  async stripeSubscription(
    @GetUser() user: User,
    @Body() subscriptiondto: subscriptionDto,
  ): Promise<string> {
    return await this.stripeConnectorService.stripeSubscription(
      user,
      subscriptiondto,
    );
  }

  @Post(requestManager.stripeConnector.methods.stripeSubscriptionPurchase.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    requestManager.stripeConnector.methods.stripeSubscriptionPurchase.roles,
  )
  async stripeSubscriptionPurchase(@GetUser() user: User): Promise<string> {
    return await this.stripeConnectorService.stripeSubscriptionPurchase(user);
  }

  @Post(requestManager.stripeConnector.methods.stripeSubscriptionCancel.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.stripeConnector.methods.stripeSubscriptionCancel.roles)
  async stripeSubscriptionCancel(@GetUser() user: User): Promise<string> {
    return await this.stripeConnectorService.stripeSubscriptionCancel(user);
  }

  @Post(requestManager.stripeConnector.methods.stripeWebhook.path)
  @Roles(requestManager.stripeConnector.methods.stripeWebhook.roles)
  async stripeWebhook(@Req() req: RawBodyRequest<Request>): Promise<string> {
    return await this.stripeConnectorService.stripeWebhook(req);
  }

  @Get(requestManager.stripeConnector.methods.payments.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.stripeConnector.methods.payments.roles)
  async getPayments(
    @GetUser() user: User,
    @Query() getAllPaymentsParamsDTO: getAllPaymentsParamsDTO,
  ): Promise<any> {
    return await this.stripeConnectorService.getPayments(
      user,
      getAllPaymentsParamsDTO,
    );
  }
}
