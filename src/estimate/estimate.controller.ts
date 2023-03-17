import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../roles.decorator';
import { requestManager } from '../request-manager/request-manager';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/models/user.model';
import {
  addEstimateDTO,
  deleteEstimateDto,
  IGetAllEstimatesDataResponse,
  updateEstimateDTO,
} from './all-estimate.dto';
import {
  EstimateService,
  getEstimateResponse,
  getEstimateResponseForPublic,
} from './estimate.service';

@Controller(requestManager.estimate.controllerPath)
export class EstimateController {
  constructor(private estimateService: EstimateService) {}

  @Get(requestManager.estimate.methods.getSpecificEstimate.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.estimate.methods.getSpecificEstimate.roles)
  async getSpecific(
    @GetUser() user: User,
    @Query('estimate_id') estimate_id: string,
  ): Promise<getEstimateResponse> {
    return await this.estimateService.getSpecificEstimate(user, estimate_id);
  }

  @Get(requestManager.estimate.methods.getSpecificEstimateForPublic.path)
  async getSpecificEstimateForPublic(
    @Query('estimate_id') estimate_id: string,
  ): Promise<getEstimateResponseForPublic> {
    return await this.estimateService.getSpecificEstimateForPublic(estimate_id);
  }

  @Get(requestManager.estimate.methods.getAllEstimates.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.estimate.methods.getAllEstimates.roles)
  async getAllEstimates(
    @GetUser() user: User,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ): Promise<IGetAllEstimatesDataResponse> {
    return await this.estimateService.getAllEstimates(user, page, limit);
  }

  @Post(requestManager.estimate.methods.searchEstimate.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.estimate.methods.searchEstimate.roles)
  async searchEstimate(
    @GetUser() user: User,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Body('term') search_term: string,
  ): Promise<IGetAllEstimatesDataResponse> {
    return await this.estimateService.searchEstimate(
      user,
      page,
      limit,
      search_term,
    );
  }

  @Post(requestManager.estimate.methods.addEstimate.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.estimate.methods.addEstimate.roles)
  async addEstimate(
    @GetUser() user: User,
    @Body(ValidationPipe) addProductDTO: addEstimateDTO,
  ): Promise<getEstimateResponse> {
    return await this.estimateService.addEstimate(addProductDTO, user);
  }

  @Put(requestManager.estimate.methods.updateEstimate.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.estimate.methods.updateEstimate.roles)
  async updateEstimate(
    @GetUser() user: User,
    @Body(ValidationPipe) updateProductDTO: updateEstimateDTO,
  ): Promise<getEstimateResponse> {
    return await this.estimateService.updateEstimate(updateProductDTO, user);
  }

  @Delete(requestManager.estimate.methods.deleteEstimate.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.estimate.methods.deleteEstimate.roles)
  async deleteEstimates(
    @GetUser() user: User,
    @Body(ValidationPipe) deleteProductDTO: deleteEstimateDto,
  ): Promise<string> {
    return await this.estimateService.deleteEsimates(deleteProductDTO, user);
  }
}
