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
import { requestManager } from '../request-manager/request-manager';
import { RolesGuard } from '../guards/roles.guard';
import { Roles, RoleTypes } from '../roles.decorator';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/models/user.model';
import {
  addOrderDTO,
  bulkUpdateOrdersDto,
  deleteOrderDTO,
  IGetAllOrdersDataResponse,
  IGetAllOrdersDataResponseForCalendar,
  updateOrderDTO,
  getOrdersParamDTO,
} from './order-all.dto';
import { getOrderResponse, OrderService } from './order.service';

@Controller(requestManager.order.controllerPath)
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get(requestManager.order.methods.getSpecificOrder.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.order.methods.getSpecificOrder.roles)
  async getSpecific(
    @GetUser() user: User,
    @Query('order_id') order_id: string,
  ): Promise<getOrderResponse> {
    return await this.orderService.getSpecificOrder(user, order_id);
  }

  @Post(requestManager.order.methods.addOrder.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.order.methods.addOrder.roles)
  async addOrder(
    @GetUser() user: User,
    @Body(ValidationPipe) addProductDTO: addOrderDTO,
  ): Promise<getOrderResponse> {
    return await this.orderService.addOrder(addProductDTO, user);
  }

  @Put(requestManager.order.methods.updateOrder.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.order.methods.updateOrder.roles)
  async updateOrder(
    @GetUser() user: User,
    @Body(ValidationPipe) updateProductDTO: updateOrderDTO,
  ): Promise<getOrderResponse> {
    return await this.orderService.updateOrder(updateProductDTO, user);
  }

  @Put(requestManager.order.methods.bulkUpdateOrderTags.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.order.methods.bulkUpdateOrderTags.roles)
  async bulkUpdateOrderTags(
    @GetUser() user: User,
    @Body(ValidationPipe) bulkupdateOrderTags: bulkUpdateOrdersDto,
  ): Promise<string> {
    return await this.orderService.bulkUpdateTagsOrder(
      bulkupdateOrderTags,
      user,
    );
  }

  @Delete(requestManager.order.methods.deleteOrder.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.order.methods.deleteOrder.roles)
  async deleteOrders(
    @GetUser() user: User,
    @Body(ValidationPipe) deleteProductDTO: deleteOrderDTO,
  ): Promise<string> {
    return await this.orderService.deleteOrder(deleteProductDTO, user);
  }

  @Get(requestManager.order.methods.getAllOrders.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.order.methods.getAllOrders.roles)
  async getAllOrders(
    @GetUser() user: User,

    @Query() serachParams: getOrdersParamDTO,
  ): Promise<IGetAllOrdersDataResponse> {
    if (!serachParams.page) {
      throw new NotFoundException('missing page info');
    }
    if (serachParams.page && parseInt(serachParams.page) < 0) {
      throw new NotFoundException('invalid page');
    }
    if (!serachParams.limit) {
      throw new NotFoundException('missing limit info');
    }
    if (serachParams.limit && parseInt(serachParams.limit) < 0) {
      throw new NotFoundException('invalid limit');
    }
    if (!serachParams.start_date) {
      throw new NotFoundException('missing start date info');
    }
    if (!serachParams.end_date) {
      throw new NotFoundException('missing end date info');
    }
    if (!serachParams.status) {
      throw new NotFoundException('missing status info');
    }

    return await this.orderService.getAllOrders(user, serachParams);
  }

  @Get(requestManager.order.methods.getOrdersForCalendar.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.order.methods.getOrdersForCalendar.roles)
  async getAllOrdersByMonth(
    @GetUser() user: User,
    @Query('start_date') start_date: string,
    @Query('end_date') end_date: string,
  ): Promise<IGetAllOrdersDataResponseForCalendar> {
    return await this.orderService.getAllOrdersByMonthForCalendar(
      user,
      start_date,
      end_date,
    );
  }

  @Get(requestManager.order.methods.getAllStatusesForOrders.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.order.methods.getAllStatusesForOrders.roles)
  async getAllStatus(
    @GetUser() user: User,
    @Query('start_date') start_date: string,
    @Query('end_date') end_date: string,
  ): Promise<string[]> {
    if (!start_date) {
      throw new NotFoundException('missing start date info');
    }
    if (!end_date) {
      throw new NotFoundException('missing end date info');
    }
    if (!parseInt(start_date)) {
      throw new NotFoundException('missing start date info');
    }
    if (!parseInt(end_date)) {
      throw new NotFoundException('missing end date info');
    }
    return await this.orderService.getAllStatusesForOrders(
      user,
      parseInt(start_date),
      parseInt(end_date),
    );
  }

  @Get(requestManager.order.methods.getOrderOverview.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.order.methods.getOrderOverview.roles)
  async orderOverview(@GetUser() user: User): Promise<string> {
    return await this.orderService.orderOverview(user);
  }

  @Get(requestManager.order.methods.convertJobToInvoice.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.order.methods.convertJobToInvoice.roles)
  async convertToInvoice(
    @GetUser() user: User,
    @Query('orderId') orderId: string,
  ): Promise<string> {
    return await this.orderService.convertToInvoice(user, orderId);
  }
}
