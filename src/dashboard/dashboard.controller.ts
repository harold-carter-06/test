import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { requestManager } from '../request-manager/request-manager';
import { RolesGuard } from '../guards/roles.guard';
import { Roles, RoleTypes } from '../roles.decorator';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/models/user.model';
import {
  DashboardService,
  getDashboardData,
  getOnboardingData,
} from './dashboard.service';

@Controller(requestManager.dashboard.controllerPath)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get(requestManager.dashboard.methods.getAnalyticsData.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.dashboard.methods.getAnalyticsData.roles)
  async getDashboardData(@GetUser() user: User): Promise<getDashboardData> {
    return await this.dashboardService.getDashboardData(user);
  }

  @Get(requestManager.dashboard.methods.getOnboardingData.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.dashboard.methods.getOnboardingData.roles)
  async getOnboardingData(@GetUser() user: User): Promise<getOnboardingData> {
    return await this.dashboardService.getUserOnboardingData(user);
  }

  @Get(requestManager.dashboard.methods.getNewAnalyticsData.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.dashboard.methods.getNewAnalyticsData.roles)
  async getNewAnalyticsData(
    @GetUser() user: User,
    @Query('customerSearch') customerSearch: number,
    @Query('jobSearch') jobSearch: number,
    @Query('invoiceSearch') invoiceSearch: number,
    @Query('convertedQuoteSearch') convertedQuoteSearch: number,
  ): Promise<any> {
    return await this.dashboardService.getNewAnalyticsData(
      user,
      customerSearch,
      jobSearch,
      invoiceSearch,
      convertedQuoteSearch,
    );
  }
}
